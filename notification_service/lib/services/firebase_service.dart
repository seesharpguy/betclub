import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/bet_notification.dart';
import 'log_service.dart';

class FirebaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<List<BetNotification>> getUnprocessedNotifications() async {
    final snapshot = await _firestore
        .collection('notifications')
        .where('processed', isEqualTo: false)
        .orderBy('createdAt')
        .get();

    log.debug('Polled Firestore: ${snapshot.docs.length} unprocessed');

    return snapshot.docs.map((doc) {
      return BetNotification.fromFirestore(doc.id, doc.data());
    }).toList();
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
}
