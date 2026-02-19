import 'dart:io';
import 'package:dart_firebase_admin/dart_firebase_admin.dart';
import 'package:dart_firebase_admin/firestore.dart';
import '../models/bet_notification.dart';
import 'log_service.dart';

class FirebaseService {
  late final FirebaseAdminApp _admin;
  late final Firestore _firestore;

  static String get keyPath =>
      '${Platform.environment['HOME']}/serviceAccountKey.json';

  static bool get keyExists => File(keyPath).existsSync();

  Future<void> initialize() async {
    if (!keyExists) {
      throw ServiceAccountNotFoundException(keyPath);
    }

    log.info('Using service account key: $keyPath');

    _admin = FirebaseAdminApp.initializeApp(
      'betclub-not-fightclub',
      Credential.fromServiceAccount(File(keyPath)),
    );
    _firestore = Firestore(_admin);
    log.info('Firebase Admin SDK initialized');
  }

  Future<List<BetNotification>> getUnprocessedNotifications() async {
    final query = _firestore
        .collection('notifications')
        .where('processed', WhereFilter.equal, false)
        .orderBy('createdAt');

    final snapshot = await query.get();

    log.debug('Polled Firestore: ${snapshot.docs.length} unprocessed');

    return snapshot.docs.map((doc) {
      final data = <String, dynamic>{};
      for (final entry in doc.data().entries) {
        data[entry.key] = _convertValue(entry.value);
      }
      return BetNotification.fromFirestore(doc.id, data);
    }).toList();
  }

  dynamic _convertValue(dynamic value) {
    if (value is Timestamp) {
      return {'seconds': value.seconds};
    }
    return value;
  }

  Future<void> markAsProcessed(String id) async {
    await _firestore.collection('notifications').doc(id).update({
      'processed': true,
    });
    log.debug('Marked processed: $id');
  }

  Future<void> markAllAsProcessed(List<String> ids) async {
    for (final id in ids) {
      await markAsProcessed(id);
    }
  }

  void dispose() {
    _admin.close();
  }
}

class ServiceAccountNotFoundException implements Exception {
  final String path;
  const ServiceAccountNotFoundException(this.path);

  @override
  String toString() => 'serviceAccountKey.json not found at $path';
}
