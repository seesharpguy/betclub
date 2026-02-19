import 'package:intl/intl.dart';

class LogService {
  static final LogService _instance = LogService._();
  factory LogService() => _instance;
  LogService._();

  bool _debugEnabled = false;
  final _timeFormat = DateFormat('HH:mm:ss');

  bool get debugEnabled => _debugEnabled;

  void setDebug(bool enabled) {
    _debugEnabled = enabled;
    info('Debug logging ${enabled ? "enabled" : "disabled"}');
  }

  void info(String message) {
    _write('INFO', message);
  }

  void debug(String message) {
    if (!_debugEnabled) return;
    _write('DEBUG', message);
  }

  void error(String message, [Object? err]) {
    _write('ERROR', err != null ? '$message: $err' : message);
  }

  void _write(String level, String message) {
    final timestamp = _timeFormat.format(DateTime.now());
    // ignore: avoid_print
    print('[$timestamp] $level  $message');
  }
}

// Convenience global accessor
final log = LogService();
