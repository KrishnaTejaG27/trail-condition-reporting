// File-based mock database - data persists across server restarts
import { 
  mockUsers, mockReports, mockPhotos, mockVotes, mockComments, mockSubscriptions,
  addReport, addPhoto, addComment, getComments, getCommentCount, deleteComment, addVote, removeVote, hasUserVoted, getVoteCount, 
  updateUser, updateReport, generateUniqueId, deleteReport, addPushSubscription, removePushSubscription, getUserSubscriptions
} from './mockDbFile';

export { 
  mockUsers, mockReports, mockPhotos, mockVotes, mockComments, mockSubscriptions,
  addReport, addPhoto, addComment, getComments, getCommentCount, deleteComment, addVote, removeVote, hasUserVoted, getVoteCount, 
  updateUser, updateReport, generateUniqueId, deleteReport, addPushSubscription, removePushSubscription, getUserSubscriptions
};
