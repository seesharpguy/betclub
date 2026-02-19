import 'dart:io';
import 'package:system_tray/system_tray.dart';
import 'log_service.dart';

class TrayService {
  final SystemTray _systemTray = SystemTray();
  String _statusText = 'Starting...';
  String? _userEmail;
  void Function()? _onSignOut;

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

  void setUser(String? email, {void Function()? onSignOut}) {
    _userEmail = email;
    _onSignOut = onSignOut;
    _updateMenu();
  }

  Future<void> updateStatus(String status) async {
    _statusText = status;
    await _updateMenu();
  }

  Future<void> _updateMenu() async {
    final menu = Menu();
    final items = <MenuItemBase>[
      MenuItemLabel(label: 'BetClub Notifier', enabled: false),
      MenuSeparator(),
    ];

    if (_userEmail != null) {
      items.add(MenuItemLabel(label: _userEmail!, enabled: false));
      items.add(MenuSeparator());
    }

    items.add(MenuItemLabel(label: _statusText, enabled: false));
    items.add(MenuSeparator());
    items.add(MenuItemLabel(
      label: 'Debug Logging: ${log.debugEnabled ? "ON" : "OFF"}',
      onClicked: (menuItem) {
        log.setDebug(!log.debugEnabled);
        _updateMenu();
      },
    ));

    if (_onSignOut != null) {
      items.add(MenuItemLabel(
        label: 'Sign Out',
        onClicked: (menuItem) => _onSignOut!(),
      ));
    }

    items.add(MenuSeparator());
    items.add(MenuItemLabel(
      label: 'Quit',
      onClicked: (menuItem) => exit(0),
    ));

    await menu.buildFrom(items);
    await _systemTray.setContextMenu(menu);
  }
}
