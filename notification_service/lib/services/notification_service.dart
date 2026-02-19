import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../models/bet_notification.dart';
import 'log_service.dart';

class NotificationService {
  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  int _notificationId = 0;

  Future<void> initialize() async {
    const macOSSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(macOS: macOSSettings);
    await _plugin.initialize(settings: initSettings);
    log.info('Notification service initialized');
  }

  Future<void> showBetNotification(BetNotification notification) async {
    const macOSDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(macOS: macOSDetails);

    await _plugin.show(
      id: _notificationId++,
      title: notification.title,
      body: notification.body,
      notificationDetails: details,
    );
    log.debug('Showed notification: ${notification.title} — ${notification.body}');
  }
}
