import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'services/auth_service.dart';
import 'services/firebase_service.dart';
import 'services/notification_service.dart';
import 'services/tray_service.dart';
import 'services/polling_service.dart';
import 'services/log_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const _NotifierApp());
}

class _NotifierApp extends StatefulWidget {
  const _NotifierApp();

  @override
  State<_NotifierApp> createState() => _NotifierAppState();
}

enum _AppState { loading, signIn, rejected, running }

class _NotifierAppState extends State<_NotifierApp> {
  final _authService = AuthService();
  final _firebaseService = FirebaseService();
  final _notificationService = NotificationService();
  final _trayService = TrayService();
  PollingService? _pollingService;

  _AppState _state = _AppState.loading;
  String? _errorMessage;
  bool _signingIn = false;

  @override
  void initState() {
    super.initState();
    _tryExistingSession();
  }

  Future<void> _tryExistingSession() async {
    if (_authService.isSignedIn) {
      final error = await _authService.checkExistingSession();
      if (error == null) {
        await _startServices();
        return;
      }
      log.info('Existing session invalid: $error');
    }
    setState(() => _state = _AppState.signIn);
  }

  Future<void> _handleSignIn() async {
    setState(() => _signingIn = true);

    final error = await _authService.signIn();
    if (error == null) {
      await _startServices();
    } else if (error.contains('invitation')) {
      setState(() {
        _state = _AppState.rejected;
        _errorMessage = error;
        _signingIn = false;
      });
    } else {
      setState(() {
        _errorMessage = error;
        _signingIn = false;
      });
    }
  }

  Future<void> _startServices() async {
    try {
      await _notificationService.initialize();
      await _trayService.initialize();

      _trayService.setUser(
        _authService.currentUser?.email,
        onSignOut: _handleSignOut,
      );

      _pollingService = PollingService(
        firebaseService: _firebaseService,
        notificationService: _notificationService,
        trayService: _trayService,
      );
      _pollingService!.start();

      log.info('BetClub Notifier running');
      setState(() => _state = _AppState.running);
    } catch (e) {
      log.error('Failed to start services', e);
      setState(() {
        _state = _AppState.signIn;
        _errorMessage = 'Failed to start: $e';
        _signingIn = false;
      });
    }
  }

  Future<void> _handleSignOut() async {
    _pollingService?.stop();
    _pollingService = null;
    await _authService.signOut();
    _trayService.setUser(null);
    setState(() {
      _state = _AppState.signIn;
      _errorMessage = null;
      _signingIn = false;
    });
  }

  void _tryDifferentAccount() {
    setState(() {
      _state = _AppState.signIn;
      _errorMessage = null;
      _signingIn = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_state == _AppState.running || _state == _AppState.loading) {
      return const SizedBox.shrink();
    }

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: Scaffold(
        body: Center(
          child: SizedBox(
            width: 360,
            child: _state == _AppState.rejected
                ? _buildRejectedView()
                : _buildSignInView(),
          ),
        ),
      ),
    );
  }

  Widget _buildSignInView() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          'BetClub Notifier',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Text(
          'Sign in to receive bet notifications',
          style: TextStyle(color: Colors.grey),
        ),
        const SizedBox(height: 32),
        if (_errorMessage != null) ...[
          Text(
            _errorMessage!,
            style: const TextStyle(color: Colors.red),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
        ],
        ElevatedButton.icon(
          onPressed: _signingIn ? null : _handleSignIn,
          icon: const Icon(Icons.login),
          label: Text(_signingIn ? 'Signing in...' : 'Sign in with Google'),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () => exit(0),
          child: const Text('Quit'),
        ),
      ],
    );
  }

  Widget _buildRejectedView() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.block, size: 48, color: Colors.red),
        const SizedBox(height: 16),
        const Text(
          'Not Authorized',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          _errorMessage ?? 'You need an invitation to use BetClub.',
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.grey),
        ),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: _tryDifferentAccount,
          child: const Text('Try a different account'),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () => exit(0),
          child: const Text('Quit'),
        ),
      ],
    );
  }
}
