const database = require('../database/dbConnection');
const { v4: uuidv4 } = require('uuid');
require("dotenv").config();
const compression = require("compression");
const express = require("express");
const moment = require('moment');
const cors = require('cors')
const axios = require('axios')
const ejs = require('ejs')
const path = require("path");
const fs = require("fs");
const { QueryFactory, getQuery } = require('../database/queryFactory');

let now;
let query_reviewerid;
let query_candidateid;
let query_corporateid;
let table_candidateid = [];
let table_reviewerid = [];
let table_corpid = null;
let meetingID;
let endDatetime
let startDatetime
let startDate
let meetingdetails
let interview_link_id;
let userId = {}
let getdetailsByUserid = []
let userOutput = {}

console.log('==> ', path.join(__dirname, '..'))

module.exports.getMeetingPage = (req, res) => {
  // res.sendFile(path.join(__dirname, "landing.html"));
  //  console.log('body ', req.body)
  let host = "host"
  const uuid = uuidv4();
  logme("uuid ", uuid)
  res.redirect(`/create-meeting/${uuid}?data=${host}`);
}

module.exports.getNewCall = async (req, res) => {
  res.sendFile(path.join(__dirname, '..', "src/newcall.html"));
}
module.exports.thankYou = async (req, res) => {
  res.sendFile(path.join(__dirname, '..', "src/success_templates/thank_you.html"));
}

module.exports.createMeeting = async (req, res) => {
  const meetingID = req.params.roomId
  if (Object.keys(req.query).length > 0) {
    const host = req?.query?.data
    logme("host" + host)
    logme("create:" + req.url + " to " + url.parse(req.url).pathname);
    // console.log("create:" + req.url + " to " + url.parse(req.url).pathname)
    res.redirect(`/join/${meetingID}`);
  } else {
    // res.sendFile(path.join(__dirname, '..', "hostRoom.html"));
    res.redirect(`/join/${meetingID}`);
  }
}

module.exports.joinMeeting = async (req, res) => {
  console.log("calling join meeting",req.params.roomId)
  table_candidateid = [];
  table_reviewerid = []
  now = moment().format('YYYY-MM-DD HH:mm')
  console.log('req query ',);
  meetingID = req.params.roomId;
  if (meetingID) {
    meetingdetails = await getDetailsByMeetingID(meetingID);
    if (meetingdetails && meetingdetails?.length > 0) {
      // if (req.query && (req?.query?.reviewerid || req?.query?.candidateid || req?.query?.corporateid)) {
        query_reviewerid = req?.query?.reviewerid || null;
        query_candidateid = req?.query?.candidateid || null;
        query_corporateid = req?.query?.corporateid || null;
        try {
          // Fetch meeting details
          // Validate meeting
          let output = await MeetingValidation(meetingdetails, query_corporateid, query_reviewerid, query_candidateid);
          console.log('output 220', output)
          if (output?.errors && output?.errors?.length > 0) {
            console.log(fs.readdirSync(__dirname));
            let errorMessage = output?.errors
            console.log('errorMessage ',errorMessage[0])
            if(errorMessage[0] == 'Meeting has already ended' || errorMessage[0] == 'Meeting has Expired'){
              // res.sendFile(path.join(__dirname, '..', 'src/error_templates/meeting_expired.html'));
              return "Expired"
              // ejs.renderFile(path.join(__dirname, '..', 'src/error.ejs'), { errorMessage }, (err, html) => {
              //   if (err) {
              //     console.error(err);
              //     res.status(500).json({ error: 'Internal server error' });
              //   } else {
              //     res.send(html);
              //   }
              // });
            }else if(errorMessage[0].includes('UnAuthorized')){
              // res.sendFile(path.join(__dirname, '..', 'src/error_templates/unauthorized.html'));
              return "unauthorized"
            }
            
          } else {
            if (output?.success && output?.success[0]?.file) {
              // res.sendFile(path.join(__dirname, '..', output?.success[0]?.file));
             return "success"
            }
          }
          // res.sendFile(path.join(__dirname, '..',"client.html"))
        } catch (error) {
          console.error(error);
         return 'Internal server error'
        }
      // } else {
      //   await renderEmailPage(req, res)
      // }
    } else {
      return "meeting_invalid"
    }
  } else {
    // res.sendFile(path.join(__dirname, '..', 'src/error_templates/meeting_invalid.html'));
   return "meeting_invalid"
  }
}

// Example route that executes a query
async function getDetailsByMeetingID(meetingID) {
  const pool = database.connectToDatabase(); // Assuming this returns a valid connection pool
  try {
    if (meetingID) {
      const params = [meetingID];
      const query = getQuery('getDetailsByMeetingID');
      const result = await database.executeQuery(pool, query, params);
      // console.log('Meeting details 114',result)
      return result;
    } else {
      return { error: 'No Meeting ID provided' }; // Adjusted error message
    }
  } catch (error) {
    console.error('Error in getDetailsByMeetingID:', error); // Log the error for debugging
    return { error: 'Internal server error' };
  }
}

async function MeetingValidation(meetingdetails, query_corporateid, query_reviewerid, query_candidateid) {
  // now = moment().format('YYYY-MM-DD')
   let output = {}
   output.errors = []
   output.success = []
  if (query_corporateid) {
    userId = { 'corporateid': query_corporateid, 'usr': 'corpo' }
    console.log('corporateid 132 ', userId)
  } else if (query_reviewerid) {
    userId = { 'reviewerid': query_reviewerid, 'usr': 'reviewer' }
    console.log('reviewerid 135 ', userId)
  } else if (query_candidateid) {
    userId = { 'candidateid': query_candidateid, 'usr': 'candidate' }
    console.log('138 candidateid ', userId)
  } else {
    userId = {}
  }
  // console.log('meetingdetails.length ', meetingdetails?.length, meetingdetails)
  if (!meetingdetails || meetingdetails?.length === 0) {
    output.errors.push('Meeting not found')
  } else {
    let meeting = meetingdetails[0];
    interview_link_id = meeting?.id
    console.log('interview_link_id 148', interview_link_id)
    let validationResult = await usersValidation(interview_link_id, userId)
    interview_duration = meeting?.duration
    startDatetime = moment(`${meeting?.start_date}T${meeting?.start_time}`).format('YYYY-MM-DD HH:mm')
    startDate = moment(`${meeting?.start_date}`).format('YYYY-MM-DD')
    // endDatetime = moment(startDatetime).add(meeting?.duration, 'minutes');
    console.log(startDate, '154 startDatetime')
    console.log(endDatetime, '155 endDatetime')
    console.log('163 ',startDate,moment(startDate).isSameOrAfter(now,'day'))
    console.log('164 ',endDatetime,moment(now).isBefore(endDatetime))
    if (moment(startDate).isSameOrAfter(now,'day')) {
      if ((startDate)) {
        if (moment(now).isBefore(endDatetime)) {
          console.log('168 validation result ', validationResult)
          if (validationResult && validationResult?.status) {
            output.success.push({ 'file': "src/client.html" })
          } else {
            if (validationResult?.message == 'No MeetingId Found') {
              output.errors.push('No MeetingId Found')
            } else {
              output.errors.push('Invalid Authrization for joining the meeting')
            }

          }
        } else {
          output.errors.push('Meeting has Expired')
        }
      }
      // else if (moment(now).isBefore(startDatetime)) {
      //     output.errors.push('Meeting has not started yet')
      //     // return res.status(403).json({ error: 'Meeting has not started yet' });
      // } 
      else {
        output.errors.push('Meeting has already ended')
        // return res.status(403).json({ error: 'Meeting has already ended' });
      }

    } else {
      output.errors.push('Meeting has already ended')
    }
  }
  console.log("outpout 204 ",output)
  return output
}

async function usersValidation(interview_link_id, userId) {
  console.log('usersValidation userId 193 ', userId,interview_link_id)
  ismeetingIdFound = false
  let corpFeedbackDetails = await getCorporateDetailsByinterview_link_id(interview_link_id);
  console.log('corpFeedbackDetails 196', corpFeedbackDetails)
  if (corpFeedbackDetails && corpFeedbackDetails.length > 0) {
    ismeetingIdFound = true
    if (userId?.usr == 'corpo') {
      corpFeedbackDetails.forEach((ele) => {
        if (ele?.corporate_user_feedback_id !== null) {
          table_corpid = ele?.corporate_user_feedback_id
          return
        }
      })
    } else if (userId?.usr == 'reviewer') {
      corpFeedbackDetails.forEach((ele) => {
        if (ele?.reviewer_id) {
          console.log('review id 287', ele?.reviewer_id)
          table_reviewerid.push(ele?.reviewer_id)
        }
      })
    } else if (userId?.usr == 'candidate') {
      corpFeedbackDetails.forEach((ele) => {
        if (ele?.candidate_id) {
          console.log('candidate id 297', ele?.candidate_id)
          table_candidateid.push(ele?.candidate_id)
        }
      })
    } else {
      console.log('No user')
    }
  } else {
    ismeetingIdFound = false
  }
  console.log('228 => ', ismeetingIdFound,table_reviewerid,table_candidateid)
  if (ismeetingIdFound) {
    if (table_candidateid && table_candidateid?.length > 0) {
      getdetailsByUserid = await getCandidateTokenByCandidateid(table_candidateid)
      table_candidateid.length = 0
    } else if (table_reviewerid && table_reviewerid?.length > 0) {
      getdetailsByUserid = await getReviwerTokenByReviwerid(table_reviewerid)
      table_reviewerid.length = 0
    } else {
      getdetailsByUserid = await getCorporateTokenByCorpId([table_corpid])
      table_corpid = null
    }

    console.log('getdetailsByUserid 218', getdetailsByUserid, getdetailsByUserid.length)
    if (getdetailsByUserid && getdetailsByUserid.length > 0) {
      getdetailsByUserid.forEach((ele) => {
        console.log('241 ele ', ele)
        if (ele?.profile_unique_tokenid == query_reviewerid) {
          userOutput = { 'status': true, 'message': 'reviewer' }

        } else if (ele?.profile_unique_tokenid == query_candidateid) {
          userOutput = { 'status': true, 'message': 'candidate' }

        } else if (ele?.profile_unique_tokenid == query_corporateid) {
          userOutput = { 'status': true, 'message': 'corp' }

        } else {
          userOutput = { 'status': false, 'message': 'no' }
        }
      })
    }
    console.log(' 256 userOutput ', userOutput)
  } else {
    userOutput = { 'status': false, 'message': 'No MeetingId Found' }
  }
  return userOutput
}

async function getCorporateDetailsByinterview_link_id (interview_link_id){
  const pool = database.connectToDatabase(); // Assuming this returns a valid connection pool
  try {
    if (interview_link_id) {
      const params = [interview_link_id];
      const query = getQuery('getCorporateDetailsByinterview_link_id');
      const result = await database.executeQuery(pool, query, params);
      // console.log('get user ids ',result)
      return result;
    } else {
      return { error: 'No interview_link_id provided' }; // Adjusted error message
    }
  } catch (error) {
    console.error('Error in getCorporateDetailsByinterview_link_id:', error); // Log the error for debugging
    return { error: 'Internal server error' };
  }
}

async function getCandidateTokenByCandidateid(table_candidateid) {
  console.log('table_candidateid 287 => ',table_candidateid)
  const pool = database.connectToDatabase(); // Assuming this returns a valid connection pool
  try {
    if (table_candidateid) {
      // table_candidateid = parseInt(table_candidateid)
      const params = [table_candidateid];
      console.log('params ',params)
      const query = getQuery('getCandidateTokenByCandidateid');
      const result = await database.executeQuery(pool, query, params);
      // console.log('get user ids 288', result)
      return result;
    } else {
      return { error: 'No candidateid provided' }; // Adjusted error message
    }
  } catch (error) {
    console.error('Error in getCandidateTokenByCandidateid:', error); // Log the error for debugging
    return { error: 'Internal server error' };
  }
}

async function getReviwerTokenByReviwerid(table_reviewerid) {
  const pool = database.connectToDatabase(); // Assuming this returns a valid connection pool
  try {
    if (table_reviewerid) {
      // table_reviewerid = parseInt(table_reviewerid)
      const params = [table_reviewerid];
      const query = getQuery('getReviwerTokenByReviwerid');
      const result = await database.executeQuery(pool, query, params);
      console.log('get user ids 306', result)
      return result;
    } else {
      return { error: 'No reviewerid provided' }; // Adjusted error message
    }
  } catch (error) {
    console.error('Error in getReviwerTokenByReviwerid:', error); // Log the error for debugging
    return { error: 'Internal server error' };
  }
}

async function getCorporateTokenByCorpId(table_corpid) {
  const pool = database.connectToDatabase(); // Assuming this returns a valid connection pool
  try {
    if (table_corpid) {
      // table_corpid = parseInt(table_corpid)
      console.log('table_corpid',table_corpid)
      const params = [table_corpid];
      const query = getQuery('getCorporateTokenByCorpId');
      const result = await database.executeQuery(pool, query, params);
      console.log('get user ids 324', result)
      return result;
    } else {
      return { error: 'No corporateid provided' }; // Adjusted error message
    }
  } catch (error) {
    console.error('Error in getCorporateTokenByCorpId:', error); // Log the error for debugging
    return { error: 'Internal server error' };
  }
}

function logme(msg, op = "") {
  let dataTime = new Date().toISOString().replace(/T/, " ").replace(/Z/, "");
  console.log("[" + dataTime + "] " + msg, op);
}

async function getUserDetailsByEmail(email,interview_link_id) {
  const pool = database.connectToDatabase(); // Assuming this returns a valid connection pool
  try {
    if (email) {
      const params = [email,interview_link_id];
      const query = getQuery('getUserDetailsByEmail');
      const result = await database.executeQuery(pool, query, params);
      // console.log('get user ids 349',result)
      return result;
    } else {
      return { error: 'No email provided' }; // Adjusted error message
    }
  } catch (error) {
    console.error('Error in getUserDetailsByEmail:', error); // Log the error for debugging
    return { error: 'Internal server error' };
  }

}

async function getCorpDetailsByEmail(email,interview_link_id) {
  const pool = database.connectToDatabase(); // Assuming this returns a valid connection pool
  try {
    if (email) {
      const params = [interview_link_id,email];
      const query = getQuery('getCorpDetailsByEmail');
      const result = await database.executeQuery(pool, query, params);
      // console.log('get user ids 349',result)
      return result;
    } else {
      return { error: 'No email provided' }; // Adjusted error message
    }
  } catch (error) {
    console.error('Error in getUserDetailsByEmail:', error); // Log the error for debugging
    return { error: 'Internal server error' };
  }

}


async function renderEmailPage(req, res) {
  // meetingID = req?.params?.roomId;
  // if (meetingID) {
  //   console.log('367 meetingID', meetingID)
  //   meetingdetails = await getDetailsByMeetingID(meetingID);
  //   if (meetingdetails && meetingdetails?.length > 0) {
  //     res.sendFile(path.join(__dirname, '..', 'src/emailPage.html'))
  //   } else {
  //     res.status(403).json({ error: "MeetiingId is Invalid " });
  //   }
  // } else {
  //   res.status(403).json({ error: "MeetingId is Null" });
  // }
}

module.exports.makeURLByEmail = async (req, res, email, roomId) => {
  console.log('controller 380 ', email, roomId)
  let output = {}
  output.errors = []
  output.success = []
  // let reviewertokens = new Set()
  // let caondidatetokens = new Set()
  let makeUrl = {};
  let usr_id = {};
  let details = {};
  meetingdetails = await getDetailsByMeetingID(roomId)
  if (meetingdetails && meetingdetails?.length > 0) {
    let meeting = meetingdetails[0];
    interview_link_id = meeting?.id
    let userDetails = await getUserDetailsByEmail(email,interview_link_id)
    let corpDetails = await getCorpDetailsByEmail(email,interview_link_id)
    console.log('corpDetails 439',corpDetails)      
    if (userDetails && userDetails?.length > 0) {
      userDetails.forEach(async (usr) => {
        if (usr?.interviewer_email == email && usr?.reviewer_id) {
          let reviewer_email = usr?.interviewer_email
          usr_id = usr?.reviewer_id
          usr_id = { 'id': usr?.reviewer_id, 'query': 'reviewerid' }
          return
          // reviewertokens.add(usr?.reviewer_id)
        } else if(usr?.candidate_email == email && usr?.candidate_id){
          let candidateEmail = usr?.candidate_email
          usr_id = { 'id': usr?.candidate_id, 'query': 'candidateid' }
          return
        }else{
          return                         
        }
      })
    } else if(corpDetails && corpDetails?.length > 0){
      corpDetails.forEach(async (corp) => {
        if (corp?.email == email && corp?.id) {
          let corp_email = corp?.email
          usr_id = corp?.id
          usr_id = { 'id': corp?.id, 'query': 'corporateid'}
          return
          // reviewertokens.add(usr?.reviewer_id)
        }
      })
    }else{
      output.errors.push('UnAuthorized Email')
      return output
    }
  } else {
    output.errors.push('Meeting Id Not Found')
    return output
  }
  console.log('414 usr_id ',usr_id)
 
  if (usr_id && Object.keys(usr_id).length > 0) {
    if (usr_id?.query == 'candidateid') {
      console.log('418 ',usr_id?.id)
      let data = usr_id?.id ? await getCandidateTokenByCandidateid([usr_id?.id]) : null
      details = {'data':data,'query': usr_id?.query}
    } else if(usr_id?.query == 'reviewerid'){
      let data = usr_id?.id ? await getReviwerTokenByReviwerid([usr_id?.id]) : null
      details = {'data':data,'query': usr_id?.query}
    }else if(usr_id?.query == 'corporateid'){
      let data = usr_id?.id ? await getCorporateTokenByCorpId([usr_id?.id]) : null
      details = {'data':data,'query': usr_id?.query}
    }else{
      details = {}
    }
  }else{
    output.errors.push('UnAthorozied EMail')
    return output
  } 
  if (details && details?.data && details?.data?.length > 0 && details?.query) {
    console.log('details 480 ',details)
    makeUrl['query']=details?.query
    details.data.forEach((ele) => {
      if (ele?.profile_unique_tokenid) {
        makeUrl['token'] = ele?.profile_unique_tokenid
      } else {
        makeUrl = {}
      }
    })
  } else {
    output.errors.push('Token not Found')
    return output
  }
  if (makeUrl && Object.keys(makeUrl).length > 0 && makeUrl?.query && makeUrl?.token) {
    // let baseUrl = "http" + (req.hostname == "localhost" ? "" : "s") + "://" + req.hostname + (req.hostname == "localhost" ? ":" + 8080 : "")
    // let suburl = `/qprofile/join/${roomId}?${makeUrl?.query}=${makeUrl?.token}`
    // let fullurl = baseUrl + suburl
    // console.log('fullurl ',fullurl)
    output.success.push({'roomId':roomId,'query':makeUrl?.query,'token':makeUrl?.token})
  }else{
    output.errors.push('URL not Valid')
  }
  // console.log('450 output ',output)
  return output
}


module.exports.allowAccess = (req, res) => {
  let allow = false
  if (userOutput && (userOutput?.message == 'reviewer' || userOutput?.message == 'corp')) {
    allow = true
  } else {
    allow = false
  }
  return res.json({ allow: allow })
}