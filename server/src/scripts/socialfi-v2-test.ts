import axios from 'axios'

const BASE_URL = 'http://localhost:8080/api'

// Fill this in with a Privy-issued JWT before running the script
// mira
// const JWT =
//   'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjJnWnQzX0pnTS1sZ2JvUGRwLUNSSzRqVklWQnhwR2JKd0RpWWZOZTVUQlkifQ.eyJjciI6IjE3NTAwOTcyNjUiLCJsaW5rZWRfYWNjb3VudHMiOiJbe1widHlwZVwiOlwiZW1haWxcIixcImFkZHJlc3NcIjpcImFobWFkbXVoYW1tYWRtYWs1QGdtYWlsLmNvbVwiLFwibHZcIjoxNzcxOTQ1Mzg4fSx7XCJpZFwiOlwibWs1bjh2MHpjaW1vdWtzODJyejRpb2phXCIsXCJ0eXBlXCI6XCJ3YWxsZXRcIixcImFkZHJlc3NcIjpcIkhwZk5jc1NFRFpROGJpOW1yUGV6c1NRVEVhZnVKd3NXRWNkeU1HNkcxejFxXCIsXCJjaGFpbl90eXBlXCI6XCJzb2xhbmFcIixcIndhbGxldF9jbGllbnRfdHlwZVwiOlwicHJpdnlcIixcImx2XCI6MTc1MDExMjUyOH1dIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzE5NDUzODgsImF1ZCI6ImNtYnplOHcwaDAwNmNqdjBtcWcyaTUyNjQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21iemVxNGUwMDA4OWw4MGxkdWF6cnRqaSIsImV4cCI6MTc3MTk0ODk4OH0.vXTtVr03uExifVD8EShvBQ-LU62Vlollu5Aav0Q-vJpvYG23PJ9SVJaVZdxhzSIkVHMSBhjt34SqCiJzyYJcnw'

// yung
const JWT =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjJnWnQzX0pnTS1sZ2JvUGRwLUNSSzRqVklWQnhwR2JKd0RpWWZOZTVUQlkifQ.eyJjciI6IjE3NTEzMjY1MDMiLCJsaW5rZWRfYWNjb3VudHMiOiJbe1widHlwZVwiOlwiZW1haWxcIixcImFkZHJlc3NcIjpcInl1bmdtazIwMDJAZ21haWwuY29tXCIsXCJsdlwiOjE3NzE5NDcwMjZ9LHtcImlkXCI6XCJzaTMzaTFqaWJoZjZjNnhxeTdlYnRnNGJcIixcInR5cGVcIjpcIndhbGxldFwiLFwiYWRkcmVzc1wiOlwiSjJQd3huQm45QTdWSGVGTVQ2VGQxQzIzd1ZqV2RyNXhmak5FN3JZNDJKdGFcIixcImNoYWluX3R5cGVcIjpcInNvbGFuYVwiLFwid2FsbGV0X2NsaWVudF90eXBlXCI6XCJwcml2eVwiLFwibHZcIjoxNzUxMzI2NTA1fV0iLCJpc3MiOiJwcml2eS5pbyIsImlhdCI6MTc3MjAxMzM4NywiYXVkIjoiY21iemU4dzBoMDA2Y2p2MG1xZzJpNTI2NCIsInN1YiI6ImRpZDpwcml2eTpjbWNqcWt5cncwM2RtanYwbXA3Nm9jamtiIiwiZXhwIjoxNzcyMDE2OTg3fQ.T6FMY0WgOPcne5shh1Cqz6U0s7-opU_4n4_W9jtemCqkDAXj0tSHbCI_HF56CdHCRsxlY3vWWkgQtCAu4UjDIg'

if (!JWT) {
  console.warn(
    '[socialfi-v2-test] JWT is empty. Please set the JWT constant to a valid token before running this script.',
  )
}

const client = axios.create({
  baseURL: BASE_URL,
  headers: JWT
    ? {
        Authorization: `Bearer ${JWT}`,
        'Content-Type': 'application/json',
      }
    : {
        'Content-Type': 'application/json',
      },
})

async function main() {
  try {
    /* console.log('--- 1. Register Tapestry profile for current user ---')
    const registerRes = await client.post('/users/tapestry/register')
    console.log('Status:', registerRes.status)
    console.log('Body:', registerRes.data)

    console.log('\n--- 2. Follow user (v2) ---')
    // TODO: replace "someuser" with an actual tag_name to test against
    const followRes = await client.post('/v2/users/follow', {
      target_tag_name: 'mira',
    })
    console.log('Status:', followRes.status)
    console.log('Body:', followRes.data)

    console.log('\n--- 3. Unfollow user (v2) ---')
    const unfollowRes = await client.post('/v2/users/unfollow', {
      target_tag_name: 'mira',
    })
    console.log('Status:', unfollowRes.status)
    console.log('Body:', unfollowRes.data)

    console.log('\n--- 4. Create post (v2) ---')
    const createPostRes = await client.post('/v2/posts', {
      content: 'Hello from Tapestry v2 test script',
      post_type: 'REGULAR',
      media: [],
    })
    console.log('Status:', createPostRes.status)
    console.log('Body:', createPostRes.data)

    const tapestryContentId =
      createPostRes.data?.data?.tapestry_content?.id ??
      createPostRes.data?.data?.post?.tapestry_content_id

    if (!tapestryContentId) {
      console.warn(
        '[socialfi-v2-test] Could not determine Tapestry content ID from createPostV2 response. Skipping comment/like/delete tests.',
      )
    } else {
      console.log('\n--- 5. Create comment on post (v2) ---')
      // const createCommentRes = await client.post(
      //   `/v2/posts/${tapestryContentId}/comments`,
      //   {
      //     post_id: tapestryContentId,
      //     text: 'Nice post! (from test script)',
      //   },
      // )
      // console.log('Status:', createCommentRes.status)
      // console.log('Body:', createCommentRes.data)

      // const tapestryCommentId =
      //   createCommentRes.data?.data?.id ??
      //   createCommentRes.data?.data?.comment?.id

      console.log('\n--- 6. Like post (v2) ---')
      const likeRes = await client.post(`/v2/posts/${tapestryContentId}/like`, {
        post_id: tapestryContentId,
      })
      console.log('Status:', likeRes.status)
      console.log('Body:', likeRes.data)

      console.log('\n--- 7. Unlike post (v2) ---')
      const unlikeRes = await client.delete(
        `/v2/posts/${tapestryContentId}/like`,
        { data: { post_id: tapestryContentId } },
      )
      console.log('Status:', unlikeRes.status)
      console.log('Body:', unlikeRes.data)

      // if (tapestryCommentId) {
      //   console.log('\n--- 8. Delete comment (v2) ---')
      //   const deleteCommentRes = await client.delete(
      //     `/v2/comments/${tapestryCommentId}`,
      //   )
      //   console.log('Status:', deleteCommentRes.status)
      //   console.log('Body:', deleteCommentRes.data)
      // }

      console.log('\n--- 9. Delete post (v2) ---')
      const deletePostRes = await client.delete(
        `/v2/posts/${tapestryContentId}`,
      )
      console.log('Status:', deletePostRes.status)
      console.log('Body:', deletePostRes.data)
    }

    console.log('\n--- 10. Get profile by tag_name (v2) ---')
    const profileV2Res = await client.get('/users/v2/tag_name/mii')
    console.log('Status:', profileV2Res.status)
    console.log('_count:', profileV2Res.data?.data?._count)
    console.log('Body (summary):', {
      success: profileV2Res.data?.success,
      tag_name: profileV2Res.data?.data?.tag_name,
      _count: profileV2Res.data?.data?._count,
    })

    console.log('\n--- 11. Get suggested profiles (v2) ---')
    const suggestedRes = await client.get('/v2/profiles/suggested')
    console.log('Status:', suggestedRes.status)
    console.log(
      'Suggested:',
      suggestedRes.data?.data?.suggested ?? suggestedRes.data,
    )
    */

    console.log('\n--- 1. Get activity feed (v2) ---')
    const feedRes = await client.get('/v2/activity/feed/mira')
    console.log('Status:', feedRes.status)
    console.log(
      'Feed (sample):',
      feedRes.data?.data?.activities?.slice?.(0, 3) ?? feedRes.data,
    )

    console.log('\n--- 2. Like Tapestry node (generic v2 like) ---')
    // Replace this with a real Tapestry node id when available
    const testNodeId = 'dummy-node-id'
    try {
      const likeNodeRes = await client.post(`/v2/likes/${testNodeId}`)
      console.log('Status:', likeNodeRes.status)
      console.log('Body:', likeNodeRes.data)
    } catch (e: any) {
      console.log(
        '[socialfi-v2-test] likeNodeV2 failed (expected if dummy id):',
        e?.response?.status,
        e?.response?.data,
      )
    }

    console.log('\n--- 3. Get likers for node (v2) ---')
    try {
      const likersRes = await client.get(`/v2/likes/${testNodeId}`)
      console.log('Status:', likersRes.status)
      console.log('Likers:', likersRes.data)
    } catch (e: any) {
      console.log(
        '[socialfi-v2-test] getNodeLikersV2 failed (expected if dummy id):',
        e?.response?.status,
        e?.response?.data,
      )
    }

    console.log('\n--- 4. Unlike Tapestry node (generic v2 unlike) ---')
    try {
      const unlikeNodeRes = await client.delete(`/v2/likes/${testNodeId}`)
      console.log('Status:', unlikeNodeRes.status)
      console.log('Body:', unlikeNodeRes.data)
    } catch (e: any) {
      console.log(
        '[socialfi-v2-test] unlikeNodeV2 failed (expected if dummy id):',
        e?.response?.status,
        e?.response?.data,
      )
    }

    console.log('\n--- 5. Get token owners (v2) ---')
    // Replace with a real token address when available
    const testTokenAddress = 'DummyTokenAddress'
    try {
      const ownersRes = await client.get(
        `/v2/tokens/${testTokenAddress}/owners`,
      )
      console.log('Status:', ownersRes.status)
      console.log('Owners (sample):', ownersRes.data)
    } catch (e: any) {
      console.log(
        '[socialfi-v2-test] getTokenOwnersV2 failed (expected if dummy token):',
        e?.response?.status,
        e?.response?.data,
      )
    }

    // console.log('\n--- 13. Get swap activity (v2) ---')
    // const swapRes = await client.get('/v2/activity/swap/mii')
    // console.log('Status:', swapRes.status)
    // console.log(
    //   'Swap (sample):',
    //   swapRes.data?.data?.transactions?.slice?.(0, 2) ?? swapRes.data,
    // )

    // console.log('\n--- 14. Get global activity (v2) ---')
    // const globalRes = await client.get('/v2/activity/global')
    // console.log('Status:', globalRes.status)
    // console.log(
    //   'Global (sample):',
    //   (globalRes.data?.data as any)?.activities?.slice?.(0, 3) ??
    //     globalRes.data,
    // )
  } catch (err: any) {
    if (err.response) {
      console.error(
        '[socialfi-v2-test] Request failed:',
        err.response.status,
        err.response.data,
      )
    } else {
      console.error('[socialfi-v2-test] Error:', err.message || err)
    }
    process.exit(1)
  }
}

main()
  .then(() => {
    console.log('\n[socialfi-v2-test] Done.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('[socialfi-v2-test] Unexpected error:', err)
    process.exit(1)
  })
