import 'dart:io';
import 'package:flutter/material.dart';
import 'services/firebase_service.dart';
import 'services/notification_service.dart';
import 'services/tray_service.dart';
import 'services/polling_service.dart';
import 'services/log_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  log.initialize();
  runApp(const _NotifierApp());
}

class _NotifierApp extends StatefulWidget {
  const _NotifierApp();

  @override
  State<_NotifierApp> createState() => _NotifierAppState();
}

class _NotifierAppState extends State<_NotifierApp> {
  bool _started = false;
  bool _showMissingKeyDialog = false;

  @override
  void initState() {
    super.initState();
    _tryStart();
  }

  Future<void> _tryStart() async {
    final firebaseService = FirebaseService();
    final notificationService = NotificationService();
    final trayService = TrayService();

    try {
      await firebaseService.initialize();
      await notificationService.initialize();
      await trayService.initialize();

      final pollingService = PollingService(
        firebaseService: firebaseService,
        notificationService: notificationService,
        trayService: trayService,
      );

      pollingService.start();
      log.info('BetClub Notifier running');
      setState(() => _started = true);
    } on ServiceAccountNotFoundException {
      log.error('Service account key not found at ${FirebaseService.keyPath}');
      setState(() => _showMissingKeyDialog = true);
    } catch (e) {
      log.error('Failed to start', e);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_started) {
      return const SizedBox.shrink();
    }

    if (_showMissingKeyDialog) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: Colors.transparent,
          body: Center(
            child: AlertDialog(
              title: const Text('Service Account Key Not Found'),
              content: Text(
                'Expected file at:\n${FirebaseService.keyPath}\n\n'
                'Place your Firebase service account key there and try again.',
              ),
              actions: [
                TextButton(
                  onPressed: () => exit(0),
                  child: const Text('Quit'),
                ),
                ElevatedButton(
                  onPressed: () {
                    setState(() => _showMissingKeyDialog = false);
                    _tryStart();
                  },
                  child: const Text('Try Again'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
