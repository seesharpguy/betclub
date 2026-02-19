import 'dart:io';
import 'package:intl/intl.dart';

class LogService {
  static final LogService _instance = LogService._();
  factory LogService() => _instance;
  LogService._();

  bool _debugEnabled = false;
  late final File _logFile;
  final _timeFormat = DateFormat('HH:mm:ss');

  bool get debugEnabled => _debugEnabled;

  void initialize() {
    final home = Platform.environment['HOME']!;
    final logDir = Directory('$home/Library/Logs/BetClubNotifier');
    if (!logDir.existsSync()) {
      logDir.createSync(recursive: true);
    }
    _logFile = File('${logDir.path}/notifier.log');
    info('Log service initialized (${_logFile.path})');
  }

  String get logPath => _logFile.path;

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
    final line = '[$timestamp] $level  $message';
    // Always print to stdout for console/log file capture
    // ignore: avoid_print
    print(line);
    try {
      _logFile.writeAsStringSync('$line\n', mode: FileMode.append);
    } catch (_) {
      // If log file write fails, stdout is enough
    }
  }
}

// Convenience global accessor
final log = LogService();
