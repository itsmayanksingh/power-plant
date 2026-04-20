import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/widgets/app_back_button.dart';
import '../attendance/attendance_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../profile/profile_screen.dart';
import '../site/site_screen.dart';
import '../submission/submission_list_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  final List<Widget> _tabs = const <Widget>[
    DashboardScreen(),
    AttendanceScreen(),
    SiteScreen(),
    SubmissionListScreen(embedded: true),
    ProfileScreen(embedded: true),
  ];

  final List<String> _titles = const <String>[
    'Dashboard',
    'Attendance',
    'My Site',
    'My Submissions',
    'Profile',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: Drawer(
        child: ListView(
          children: <Widget>[
            const DrawerHeader(
              child: Text(
                'Plant Monitoring',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.sync),
              title: const Text('Offline Sync'),
              onTap: () => context.push('/sync'),
            ),
            ListTile(
              leading: const Icon(Icons.notifications_active_outlined),
              title: const Text('Notification Settings'),
              onTap: () => context.push('/notifications'),
            ),
            ListTile(
              leading: const Icon(Icons.list_alt),
              title: const Text('Logs'),
              onTap: () => context.push('/logs'),
            ),
          ],
        ),
      ),
      appBar: AppBar(
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        title: Text(_titles[_index]),
        actions: const <Widget>[AppBackButton()],
      ),
      body: Container(
        padding: const EdgeInsets.all(16),
        child: _tabs[_index],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (v) => setState(() => _index = v),
        destinations: const <NavigationDestination>[
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.timer_outlined), label: 'Attendance'),
          NavigationDestination(icon: Icon(Icons.factory_outlined), label: 'My Site'),
          NavigationDestination(icon: Icon(Icons.assignment_outlined), label: 'Submissions'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}

