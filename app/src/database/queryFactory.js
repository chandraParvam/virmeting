const QueryFactory = {
  getDetailsByMeetingID: `SELECT id, video_interview_id, reviewer_id, candidate_id,
      test_link, duration, start_time, end_time, start_date, end_date
      FROM public.practice_interviews_olc_video_interview_link
      WHERE test_link = $1`,
  getCorporateDetailsByinterview_link_id: `SELECT id,interview_link_id,interviewer_name, interviewer_email, candidate_name, candidate_email,
      candidate_id,reviewer_id,corporate_user_feedback_id 
      FROM public.practice_interviews_corporate_interview_feedback where interview_link_id = $1`,
  getCandidateTokenByCandidateid: `SELECT id,user_id,profile_unique_tokenid
      FROM public.user_profiles_corporate_candidate_profile where id=ANY($1)`,
  getReviwerTokenByReviwerid: `SELECT id,user_id,profile_unique_tokenid
      FROM public.user_profiles_corporate_reviewer_profile where id=ANY($1)`,
  getCorporateTokenByCorpId: `SELECT id,corporate_master_id,profile_unique_tokenid
      FROM public.user_profiles_corporate_users where id=ANY($1)`,
  getCorpDetailsByEmail : `SELECT u.id, u.email, u.profile_unique_tokenid
  FROM user_profiles_corporate_users u
  JOIN practice_interviews_corporate_interview_feedback f ON u.id = f.corporate_user_feedback_id
  and f.interview_link_id=$1
  WHERE u.email =$2`,
  getUserDetailsByEmail: `SELECT id, interview_link_id, interviewer_name, interviewer_email, candidate_name, candidate_email,
      candidate_id, reviewer_id, corporate_user_feedback_id 
      FROM public.practice_interviews_corporate_interview_feedback 
      WHERE ((interviewer_email = $1 OR candidate_email = $1)
      AND (interviewer_email = 'parishath29@outlook.com' OR interviewer_email IS NOT NULL)
      AND (candidate_email = 'parishath29@outlook.com' OR candidate_email IS NOT NULL)) AND interview_link_id= $2`

};

module.exports.QueryFactory = QueryFactory;

module.exports.getQuery = (queryName) => {
  return QueryFactory[queryName];
};