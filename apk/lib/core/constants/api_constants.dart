class ApiConstants {
  ApiConstants._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.216.13.241:5000',
  );
  static const String apiPrefix = '/api/v1';

  static const String login = '$apiPrefix/auth/login';
  static const String refresh = '$apiPrefix/auth/refresh';
  static const String logout = '$apiPrefix/auth/logout';
  static const String changePassword = '$apiPrefix/auth/change-password';
  static const String me = '$apiPrefix/users/me';
  static const String mySite = '$apiPrefix/sites/my-site';
  static const String submissions = '$apiPrefix/submissions';
  static const String attendanceCheckIn = '$apiPrefix/attendance/check-in';
  static const String attendanceCheckOut = '$apiPrefix/attendance/check-out';
  static const String attendanceMy = '$apiPrefix/attendance/my';
}

