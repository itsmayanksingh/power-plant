import 'package:flutter/foundation.dart';

class AppLog {
  AppLog({
    required this.level,
    required this.message,
    required this.source,
    required this.timestamp,
  });

  final String level;
  final String message;
  final String source;
  final DateTime timestamp;
}

class AppLogStore extends ChangeNotifier {
  AppLogStore._();
  static final AppLogStore instance = AppLogStore._();

  final List<AppLog> _logs = <AppLog>[];

  List<AppLog> get logs => List.unmodifiable(_logs.reversed);

  void add({
    required String level,
    required String message,
    required String source,
  }) {
    _logs.add(
      AppLog(
        level: level,
        message: message,
        source: source,
        timestamp: DateTime.now(),
      ),
    );
    if (_logs.length > 250) {
      _logs.removeRange(0, _logs.length - 250);
    }
    notifyListeners();
  }
}

