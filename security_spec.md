# Firebase Security Specification - myRecovery Spokane

## Data Invariants
- **Identity Isolation**: Users cannot modify profiles or attendance records of other users.
- **Admin Supremacy**: Only users with the `admin` role in their `/users/{uid}` document can modify the `/meetings` collection.
- **Mentor Integrity**: Sponsor profiles can only be updated by the mentor themselves (bio/specialties) or by an admin (status/verification).
- **Communication Privacy**: Chat sessions and their messages are strictly private to the two participants (user and mentor).
- **Temporal Strictness**: All `lastMessageAt`, `timestamp`, and `date` fields must be validated.

## The Dirty Dozen Payloads (Target: PERMISSION_DENIED)

1. **Identity Spoofing**: Attempt to update another user's profile.
   - `path`: `/users/victim_uid`
   - `payload`: `{ "role": "admin", "name": "Hacker" }`
2. **Privilege Escalation**: Attempt to set own role to `admin` during creation.
   - `path`: `/users/attacker_uid` (create)
   - `payload`: `{ "email": "attacker@evil.com", "name": "Attacker", "role": "admin" }`
3. **Ghost Meeting**: Anonymous user attempting to create a meeting.
   - `path`: `/meetings/new_meeting`
   - `payload`: `{ "name": "Fake AA", "lat": 0, "lng": 0, ... }`
4. **Illegal Verification**: Non-admin user attempting to verify themselves as a sponsor.
   - `path`: `/sponsors/attacker_sponsor_id`
   - `payload`: `{ "status": "verified", "isVerified": true }`
5. **Orphaned Message**: Attempting to send a message to a chat the user is not part of.
   - `path`: `/chats/chat_between_others/messages/msg_123`
   - `payload`: `{ "text": "I am watching you", "senderId": "attacker_uid" }`
6. **Chat Hijacking**: Attempting to read a chat session metadata belonging to others.
   - `path`: `/chats/chat_between_others`
   - `op`: `get`
7. **Resource Poisoning**: Injection of a massive bio string.
   - `path`: `/sponsors/my_sponsor_id`
   - `payload`: `{ "bio": "A".repeat(10001) }`
8. **Invalid ID Injection**: Passing a non-conforming document ID.
   - `path`: `/meetings/!!!bad_id!!!`
   - `op`: `create`
9. **Timestamp Faking**: Providing a client-side timestamp instead of `request.time`.
   - `path`: `/chats/my_chat/messages/msg_1`
   - `payload`: `{ "timestamp": "2000-01-01T00:00:00Z", ... }`
10. **Shadow Field Injection**: Adding the `isVerified` field to a `User` document.
    - `path`: `/users/my_uid`
    - `payload`: `{ "isVerified": true }` (User entity doesn't have this field)
11. **Attendance Forgery**: Attempting to log attendance for another user.
    - `path`: `/users/victim_uid/attendance/new_record`
    - `payload`: `{ "meetingId": "123", "date": "2026-05-17" }`
12. **Unverified Reader**: Attempting to list all users (PII leak).
    - `path`: `/users`
    - `op`: `list`

## Test Runner (firestore.rules.test.ts)
(To be implemented after rules drafting)
