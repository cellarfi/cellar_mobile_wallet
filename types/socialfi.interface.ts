
export interface SearchUser {
  display_name: string;
  tag_name: string;
  profile_picture_url: string;
  id: string;
}


export interface SuggestedAccounts {
  id: string;
  display_name: string;
  tag_name: string;
  _count: {
    followers: number;
    following: number;
  };
  profile_picture_url: string | null;
  following: boolean;
}
