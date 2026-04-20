import 'package:flutter/material.dart';

import '../../core/services/toast_service.dart';
import '../../core/storage/local_db.dart';
import '../../core/widgets/app_page.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool checkInReminder = true;
  bool submitReminder = true;
  bool checkOutReminder = true;

  @override
  void initState() {
    super.initState();
    final settings = LocalDb.settings();
    checkInReminder = (settings.get('check_in_reminder')?['value'] ?? true) as bool;
    submitReminder = (settings.get('submit_reminder')?['value'] ?? true) as bool;
    checkOutReminder = (settings.get('check_out_reminder')?['value'] ?? true) as bool;
  }

  Future<void> _toggle({
    required String key,
    required bool value,
    required String label,
  }) async {
    await LocalDb.settings().put(key, <String, dynamic>{'value': value});
    ToastService.info('$label ${value ? 'activated' : 'deactivated'}');
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return AppPage(
      title: 'Notification Preferences',
      child: ListView(
        children: <Widget>[
          Card(
            child: SwitchListTile(
              value: checkInReminder,
              title: const Text('Check-in Reminder'),
              subtitle: const Text('Daily reminder before shift start'),
              onChanged: (v) {
                checkInReminder = v;
                _toggle(key: 'check_in_reminder', value: v, label: 'Check-in reminder');
              },
            ),
          ),
          Card(
            child: SwitchListTile(
              value: submitReminder,
              title: const Text('Submission Reminder'),
              subtitle: const Text('Remind to submit plant readings'),
              onChanged: (v) {
                submitReminder = v;
                _toggle(key: 'submit_reminder', value: v, label: 'Submission reminder');
              },
            ),
          ),
          Card(
            child: SwitchListTile(
              value: checkOutReminder,
              title: const Text('Check-out Reminder'),
              subtitle: const Text('Remind before end of shift'),
              onChanged: (v) {
                checkOutReminder = v;
                _toggle(key: 'check_out_reminder', value: v, label: 'Check-out reminder');
              },
            ),
          ),
        ],
      ),
    );
  }
}

