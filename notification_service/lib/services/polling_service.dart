import 'dart:async';
import 'firebase_service.dart';
import 'notification_service.dart';
import 'tray_service.dart';
import 'log_service.dart';

class PollingService {
  final FirebaseService _firebaseService;
  final NotificationService _notificationService;
  final TrayService _trayService;
  Timer? _timer;
  bool _isFirstPoll = true;
  int _totalNotified = 0;

  PollingService({
    required FirebaseService firebaseService,
    required NotificationService notificationService,
    required TrayService trayService,
  })  : _firebaseService = firebaseService,
        _notificationService = notificationService,
        _trayService = trayService;

  void start() {
    log.info('Polling service started (10s interval)');
    // Run immediately, then every 10 seconds
    _poll();
    _timer = Timer.periodic(const Duration(seconds: 10), (_) => _poll());
  }

  Future<void> _poll() async {
    try {
      final notifications =
          await _firebaseService.getUnprocessedNotifications();

      if (notifications.isEmpty) {
        await _trayService.updateStatus('Listening...');
        return;
      }

      final now = DateTime.now();
      final fiveMinutesAgo = now.subtract(const Duration(minutes: 5));

      for (final notification in notifications) {
        // On first poll, silently mark old notifications as processed
        if (_isFirstPoll &&
            notification.createdAt != null &&
            notification.createdAt!.isBefore(fiveMinutesAgo)) {
          log.info('Skipping old notification: ${notification.id}');
          await _firebaseService.markAsProcessed(notification.id);
          continue;
        }

        // Show native notification
        await _notificationService.showBetNotification(notification);
        _totalNotified++;
        log.info('Notified: ${notification.title}');

        // Mark as processed
        await _firebaseService.markAsProcessed(notification.id);
      }

      _isFirstPoll = false;

      if (_totalNotified > 0) {
        await _trayService
            .updateStatus('$_totalNotified bet(s) notified today');
      } else {
        await _trayService.updateStatus('Listening...');
      }
    } catch (e) {
      log.error('Poll error', e);
      await _trayService.updateStatus('Error - retrying...');
    }
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }
}
