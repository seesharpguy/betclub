class BetNotification {
  final String id;
  final String type; // "bet_created" | "bet_taken"
  final String betId;
  final String betDescription;
  final double betAmount;
  final String creatorName;
  final String? creatorPhoto;
  final String? takerName;
  final String? takerPhoto;
  final DateTime? createdAt;
  final bool processed;

  BetNotification({
    required this.id,
    required this.type,
    required this.betId,
    required this.betDescription,
    required this.betAmount,
    required this.creatorName,
    this.creatorPhoto,
    this.takerName,
    this.takerPhoto,
    this.createdAt,
    this.processed = false,
  });

  factory BetNotification.fromFirestore(String id, Map<String, dynamic> data) {
    return BetNotification(
      id: id,
      type: data['type'] as String? ?? 'bet_created',
      betId: data['betId'] as String? ?? '',
      betDescription: data['betDescription'] as String? ?? '',
      betAmount: (data['betAmount'] as num?)?.toDouble() ?? 0.0,
      creatorName: data['creatorName'] as String? ?? 'Unknown',
      creatorPhoto: data['creatorPhoto'] as String?,
      takerName: data['takerName'] as String?,
      takerPhoto: data['takerPhoto'] as String?,
      createdAt: _parseTimestamp(data['createdAt']),
      processed: data['processed'] as bool? ?? false,
    );
  }

  static DateTime? _parseTimestamp(dynamic value) {
    if (value == null) return null;
    // dart_firebase_admin returns Timestamp objects with seconds/nanoseconds
    if (value is Map) {
      final seconds = value['_seconds'] as int? ?? value['seconds'] as int? ?? 0;
      return DateTime.fromMillisecondsSinceEpoch(seconds * 1000);
    }
    return null;
  }

  String get title {
    if (type == 'bet_taken') {
      return '${takerName ?? 'Someone'} took a bet!';
    }
    return '$creatorName created a bet!';
  }

  String get body {
    final amount = '\$${betAmount.toStringAsFixed(2)}';
    return '$amount - $betDescription';
  }
}
