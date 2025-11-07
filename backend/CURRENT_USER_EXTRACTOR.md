# CurrentUser Extractor - Usage Examples

The `CurrentUser` extractor automatically validates JWT tokens and fetches the authenticated user from the database. This eliminates repetitive authentication code in your handlers.

## Basic Usage

### Required Authentication
```rust
use crate::utils::auth_extractor::CurrentUser;

#[get("/profile")]
async fn get_profile(current_user: CurrentUser) -> Result<Json<ProfileResponse>> {
    let user = current_user.0;
    
    Ok(Json(ProfileResponse {
        id: user.id,
        username: user.username,
        email: user.email,
    }))
}
```

### Optional Authentication
```rust
use crate::utils::auth_extractor::MaybeCurrentUser;

#[get("/posts")]
async fn list_posts(maybe_user: MaybeCurrentUser) -> Result<Json<Vec<Post>>> {
    match maybe_user.0 {
        Some(user) => {
            // Show personalized posts for authenticated user
            get_posts_for_user(user.id).await
        },
        None => {
            // Show public posts for guest
            get_public_posts().await
        }
    }
}
```

### Mix with Other Extractors
```rust
#[post("/posts")]
async fn create_post(
    current_user: CurrentUser,
    data: Json<CreatePostRequest>,
    state: Data<AppState>,
) -> Result<Json<Post>> {
    let user = current_user.0;
    
    // User is guaranteed to be authenticated
    let post = Post::create(
        &state.db,
        user.id,
        data.into_inner()
    ).await?;
    
    Ok(Json(post))
}
```

## How It Works

1. **Extracts Bearer Token**: Automatically extracts the `Authorization: Bearer <token>` header
2. **Validates JWT**: Decodes and validates the JWT token using your secret key
3. **Fetches User**: Retrieves the full user model from the database
4. **Injects User**: Provides the authenticated user to your handler

## Error Handling

The extractor automatically returns appropriate HTTP errors:
- **401 Unauthorized**: Missing token, invalid token, or user not found
- **500 Internal Server Error**: Database connection issues

## Benefits

✅ **DRY Principle**: Write auth logic once, use everywhere  
✅ **Type Safety**: User is guaranteed to be authenticated  
✅ **Clean Code**: Handlers focus on business logic, not authentication  
✅ **Composable**: Mix with other extractors seamlessly  
✅ **Automatic**: No manual token extraction or validation needed

## Implementation Details

- Located in: `src/utils/auth_extractor.rs`
- Implements `FromRequest` trait
- Async-friendly with proper Future handling
- Comprehensive error logging
