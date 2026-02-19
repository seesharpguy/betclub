import 'dart:io';
import 'package:system_tray/system_tray.dart';
import 'log_service.dart';

class TrayService {
  final SystemTray _systemTray = SystemTray();
  String _statusText = 'Starting...';

  Future<void> initialize() async {
    await _systemTray.initSystemTray(
      title: '',
      iconPath: 'assets/tray_icon.png',
      toolTip: 'BetClub Notifier',
    );

    await _updateMenu();

    _systemTray.registerSystemTrayEventHandler((eventName) {
      if (eventName == kSystemTrayEventClick ||
          eventName == kSystemTrayEventRightClick) {
        _systemTray.popUpContextMenu();
      }
    });

    log.info('Tray service initialized');
  }

  Future<void> updateStatus(String status) async {
    _statusText = status;
    await _updateMenu();
  }

  Future<void> _updateMenu() async {
    final menu = Menu();
    await menu.buildFrom([
      MenuItemLabel(label: 'BetClub Notifier', enabled: false),
      MenuSeparator(),
      MenuItemLabel(label: _statusText, enabled: false),
      MenuSeparator(),
      MenuItemLabel(
        label: 'Debug Logging: ${log.debugEnabled ? "ON" : "OFF"}',
        onClicked: (menuItem) {
          log.setDebug(!log.debugEnabled);
          _updateMenu();
        },
      ),
      MenuItemLabel(
        label: 'View Logs',
        onClicked: (menuItem) {
          Process.run('open', [log.logPath]);
        },
      ),
      MenuSeparator(),
      MenuItemLabel(
        label: 'Quit',
        onClicked: (menuItem) => exit(0),
      ),
    ]);
    await _systemTray.setContextMenu(menu);
  }
}
