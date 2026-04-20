import 'package:intl/intl.dart';

class AppDateFormatter {
  AppDateFormatter._();
  static final DateFormat _dt = DateFormat('dd MMM yyyy, hh:mm a');
  static final DateFormat _d = DateFormat('dd MMM yyyy');

  static String dateTime(DateTime value) => _dt.format(value);
  static String date(DateTime value) => _d.format(value);
}

