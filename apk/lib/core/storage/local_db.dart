import 'package:hive/hive.dart';

class LocalDb {
  LocalDb._();

  static const String pendingSubmissionBox = 'pending_submissions';
  static const String settingsBox = 'settings';
  static const String syncLogsBox = 'sync_logs';

  static Future<void> init() async {
    await Hive.openBox<Map>(pendingSubmissionBox);
    await Hive.openBox<Map>(settingsBox);
    await Hive.openBox<Map>(syncLogsBox);
  }

  static Box<Map> pendingBox() => Hive.box<Map>(pendingSubmissionBox);
  static Box<Map> settings() => Hive.box<Map>(settingsBox);
  static Box<Map> syncLogs() => Hive.box<Map>(syncLogsBox);
}

