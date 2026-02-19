import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'log_service.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  User? get currentUser => _auth.currentUser;
  bool get isSignedIn => _auth.currentUser != null;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Sign in with Google and check invitation authorization.
  /// Returns null on success, or an error message on failure.
  Future<String?> signIn() async {
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        return 'Sign-in cancelled';
      }

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await _auth.signInWithCredential(credential);
      final user = userCredential.user;
      if (user == null) {
        return 'Sign-in failed';
      }

      final email = user.email?.toLowerCase();
      if (email == null) {
        await _signOutQuietly();
        return 'No email associated with this account';
      }

      // Check authorization (mirrors auth-context.tsx logic)
      final authError = await _checkAuthorization(user, email);
      if (authError != null) {
        await _signOutQuietly();
        return authError;
      }

      log.info('Signed in as $email');
      return null;
    } catch (e) {
      log.error('Sign-in error', e);
      return 'Sign-in failed: $e';
    }
  }

  /// Check if user is authorized via admin status or invitation.
  Future<String?> _checkAuthorization(User user, String email) async {
    // Check if user is already an admin (admins skip invite check)
    final userDoc =
        await _firestore.collection('users').doc(user.uid).get();
    final isAdmin = userDoc.data()?['isAdmin'] == true;

    if (!isAdmin) {
      // Non-admin must have an invitation
      final inviteDoc =
          await _firestore.collection('invitations').doc(email).get();

      if (!inviteDoc.exists) {
        log.info('No invitation found for $email');
        return 'You need an invitation to use BetClub.\nAsk an admin to invite $email.';
      }

      // Accept pending invitation
      if (inviteDoc.data()?['status'] == 'pending') {
        await inviteDoc.reference.update({'status': 'accepted'});
        log.info('Accepted invitation for $email');
      }
    }

    // Write/update user document
    await _firestore.collection('users').doc(user.uid).set({
      'uid': user.uid,
      'displayName': user.displayName ?? 'Anonymous',
      'email': user.email ?? '',
      'photoURL': user.photoURL,
      'createdAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    return null;
  }

  /// Re-check authorization for a returning user (session persisted by Firebase Auth).
  Future<String?> checkExistingSession() async {
    final user = _auth.currentUser;
    if (user == null) return 'Not signed in';

    final email = user.email?.toLowerCase();
    if (email == null) {
      await _signOutQuietly();
      return 'No email associated with this account';
    }

    final authError = await _checkAuthorization(user, email);
    if (authError != null) {
      await _signOutQuietly();
      return authError;
    }

    log.info('Existing session valid for $email');
    return null;
  }

  Future<void> signOut() async {
    await _auth.signOut();
    await _googleSignIn.signOut();
    log.info('Signed out');
  }

  Future<void> _signOutQuietly() async {
    try {
      await _auth.signOut();
      await _googleSignIn.signOut();
    } catch (_) {}
  }
}
