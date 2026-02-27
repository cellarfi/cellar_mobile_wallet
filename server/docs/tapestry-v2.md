## Tapestry SocialFi v2

### Overview

- **What**: Tapestry-backed SocialFi v2 endpoints layered alongside existing v1 social features.
- **Why**: Use Tapestry as the social graph (profiles, follows, content, engagement) without breaking current behavior.

### Configuration

- **Env**:
  - `TAPESTRY_API_KEY`: API key from Tapestry.
  - Optional: `TAPESTRY_BASE_URL` (defaults to `https://api.usetapestry.dev/v1/`).
- **Client**: `tapestryClient` is created in `src/utils/platforms.util.ts` using the `socialfi` SDK and adds `x-api-key` header.

### Prisma fields

- `User.tapestry_profile_id: String?` – stores the Tapestry profile ID.
- `Notification.tapestry_content_id: String?` – optional Tapestry content ID for v2 notifications.
- `Notification.tapestry_comment_id: String?` – optional Tapestry comment ID for v2 notifications.
- `Mention.tapestry_content_id: String?` – optional Tapestry content ID for v2 mentions (v1 mentions continue to use `post_id`).

### User onboarding flow

- `createUser` (`usersController`) now:
  - Creates the local user and default wallet as before.
  - Best-effort calls `TapestryService.findOrCreateProfile` using:
    - Wallet address (default wallet from Privy),
    - `tag_name` as username,
    - `display_name`, `profile_picture_url`, `about`,
    - Simple properties for referral metadata.
  - Persists `tapestry_profile_id` on the user record.

### TapestryService

- Implemented in `src/service/tapestryService.ts`.
- Wraps `socialfi` SDK:
  - Profiles: `findOrCreateProfile`, `updateProfile`.
  - Follows: `followProfile`, `unfollowProfile`.
  - Content: `findOrCreateContent`.
  - Comments: `createComment`.
  - Likes: `likeNode`, `unlikeNode`.
- Normalizes errors into `{ code, status?, message, details? }` for controllers.

### v2 Endpoints (Tapestry-only content)

All mounted under `app.use('/api', socialfiV2Routes)` and protected by `authMiddleware()`:

- **Follow / Unfollow**
  - `POST /api/v2/users/follow`
  - `POST /api/v2/users/unfollow`
  - Body (`followUserV2Schema`):
    - `target_user_id?: string`
    - `target_tag_name?: string`
    - At least one of the above is required.
  - Behavior:
    - Ensures both users have Tapestry profiles (creates them if missing).
    - Mirrors follow into local `Follower` table.
    - Awards `USER_FOLLOW` points to follower and followee.
    - Sends `NEW_FOLLOWER` notification (same pattern as v1).
    - Calls Tapestry followers API to follow/unfollow.

-- **Posts**
  - `POST /api/v2/posts`
  - Body (`createPostV2Schema`): based on `createUnifiedPost` with optional `tapestry_execution_mode`.
  - Behavior:
    - Ensures Tapestry profile exists for the author.
    - Calls `TapestryService.findOrCreateContent` with:
      - `profileId` (author profile),
      - A generated Tapestry-only `contentId`,
      - Properties mapping `post_type`, fundraising/token metadata, etc.
    - Does **not** create a local `Post` row.
    - Awards `POST_CREATION` points keyed by the Tapestry content ID.

- **Comments**
  - `POST /api/v2/posts/:post_id/comments`
  - Body (`createCommentV2Schema`): extends `createCommentSchema` with optional `tapestry_execution_mode`.
  - Behavior:
    - Validates body with user ID from auth.
    - Treats `post_id` as the **Tapestry content ID**.
    - Ensures Tapestry profile exists for commenter.
    - Calls `TapestryService.createComment` with the Tapestry content ID.
    - Awards `POST_COMMENT` points keyed by Tapestry content and comment IDs.
    - No local `Comment` row is created.

- **Likes**
  - `POST /api/v2/posts/:post_id/like`
  - Body (`likePostV2Schema`):
    - `post_id: string` (Tapestry content/node ID, from param or body).
  - Behavior:
    - Ensures Tapestry profile exists for liker.
    - Calls `TapestryService.likeNode` with the Tapestry node ID.
    - Awards `POST_LIKE` points keyed by the Tapestry content ID.
    - No local `Like` row is created.

### DTOs

Defined in `src/utils/dto/socialfi.dto.ts`:

- `followUserV2Schema` / `FollowUserV2Dto`.
- `createPostV2Schema` / `CreatePostV2Dto`.
- `createCommentV2Schema` / `CreateCommentV2Dto`.
- `likePostV2Schema` / `LikePostV2Dto`.

### Notes

- Existing v1 endpoints and behavior remain unchanged and continue to use local `Post`/`Comment`/`Like` rows.
- v2 endpoints are explicitly versioned under `/api/v2/...` and are Tapestry-backed, with content and engagement data stored only on Tapestry.
- Error strategy:
  - Local DB errors surface as usual 4xx/5xx.
  - Tapestry errors are logged and surfaced as 5xx for pure-social actions.
  - For user creation, Tapestry failure is non-fatal; user is still created locally.

