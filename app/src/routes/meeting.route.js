// routes/exampleRoutes.js

const express = require('express');
const router = express.Router();
const MeetingController = require('../controller/meeting.controller');
const axios = require('axios')
const path = require("path");
// Define routes
// router.get('/',(req,res)=>{
//     MeetingController.getMeetingPage(req,res)
// });
router.get('/email', async (req, res) => {
  // const { email, meetingid } = req.query;
  const email = req.query.email
  const meetingid = req.query.meetingid
  // Now you have access to email and meetingid
  console.log('Received email:', email);
  console.log('Received meeting ID:', meetingid);
  if (email && meetingid) {
    // If email and meetingid are provided, you can use them
    let result = await MeetingController.makeURLByEmail(req, res, email, meetingid);
    console.log('22 route ',result)
    if (result && result?.success && result?.success?.length > 0) {
      try {
        const meetingId = result.success[0].meetingid;
        const queryMsg = result.success[0].query;
        const tokenId = result.success[0].token;
        // Redirect to the join page
        // window.location.href = `/qprofile/join/${meetingId}?${queryMsg}=${tokenId}`
        console.log('result 21 route', `/qprofile/join/${meetingId}?${queryMsg}=${tokenId}`)
        const url = `/qprofile/join/${meetingId}?${queryMsg}=${tokenId}`;
        // Set Cache-Control header to prevent caching
        res.setHeader('Cache-Control', 'no-cache');
        // Redirect to the URL with query parameters
        res.redirect(url);
      } catch (error) {
        console.error('Error while processing result:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    } else if (result && result.errors && result.errors.length > 0) {
      console.log('result.errors ',result.errors[0])
      result.errors.forEach(err=>{
        if(err.includes('UnAuthorized')){
          res.sendFile(path.join(__dirname, '..', 'src/error_templates/unauthorized.html'));
        }else{
          res.sendFile(path.join(__dirname, '..', 'src/error_templates/meeting_expired.html'));
        }
      })
      // Handle the case where the meeting has expired
    } else {
      console.error('No success response obtained from result',"result.errors ==>",result.errors);
      res.status(500).json({ error: result.errors});
    }
  } else if (!meetingid) {
    res.status(400).json('Meeting ID is missing');
  } else {
    res.status(400).json('Email is missing');
  }
});


router.get('/newcall', async (req, res) => {
  await MeetingController.getNewCall(req, res)
});
router.get('/thankyou', async (req, res) => {
  await MeetingController.thankYou(req, res)
});
// router.get('/create-meeting/:meetingid',(req,res)=>{
//     MeetingController.createMeeting(req,res)
// });
router.get('/join/:meetingid', async (req, res) => {
  console.log('calling join route ', req.query)
  if (req.query && (req?.query?.reviewerid || req?.query?.candidateid || req?.query?.corporateid)) {
    await MeetingController.joinMeeting(req, res)
  } else {
    res.sendFile(path.join(__dirname, '..', 'src/emailPage.html'))
  }
});

router.get('/allowrecord', async (req, res) => {
  console.log('/allowrecord ')
  await MeetingController.allowAccess(req, res)
});




function logme(msg, op = "") {
  let dataTime = new Date().toISOString().replace(/T/, " ").replace(/Z/, "");
  console.log("[" + dataTime + "] " + msg, op);
}

module.exports = router;

/*app.get(["/"], (req, res) => {
    // res.sendFile(path.join(__dirname, "landing.html"));
    console.log('body ', req.body)
    let host = "host"
    const uuid = uuidv4();
    logme("uuid ", uuid)
    res.redirect(`/create-meeting/${uuid}?data=${host}`);
});
  
  // set new room name and join
  app.get("/newcall", (req, res) => {
   
  });
  
  app.get("/createmeeting", (req, res) => {
    // let authorization = req.headers.authorization;
    // if (authorization != API_KEY_SECRET) {
    //   //logme("get meeting - Unauthorized", {
    //     header: req.headers,
    //     body: req.body,
    //   });
    //   return res.status(403).json({ error: "Unauthorized!" });
    // }
    // // setup  meeting URL 
    // let host = req.headers.host || "host";
    let host = "host"
    const uuid = uuidv4();
    logme("uuid ", uuid)
    res.redirect(`/create-meeting/${uuid}?data=${host}`);
  });
  
  app.get("/create-meeting/:meetingid", (req, res) => {
    // logme("create:" + req.url + " to " + url.parse(req.url).pathname);
    const meetingID = req.params.meetingid
    if (Object.keys(req.query).length > 0) {
      const host = req.query.data
      logme("host" + host)
      // logme("create:" + req.url + " to " + url.parse(req.url).pathname);
      // console.log("create:" + req.url + " to " + url.parse(req.url).pathname)
      res.redirect(`/join/${meetingID}`);
    } else {
      // res.sendFile(path.join(__dirname, "hostRoom.html"));
      res.redirect(`/join/${meetingID}`);
    }
  });

app.get("/join/:meetingid", async (req, res) => {
    now = moment().format('YYYY-MM-DD HH:mm')
    console.log('api call 208')
    console.log('req query ', req.query);
    meetingID = req.params.meetingid;
    hostid = req.query.hostid;
    candidateid = req.query.candidateid;
    try {
      // Fetch meeting details
      meetingdetails = await getDetailsByMeetingID(meetingID);
      // Validate meeting
      let output = await MeetingValidation(meetingdetails, hostid, candidateid);
      console.log('output 220', output)
      if (output?.errors && output?.errors?.length > 0) {
        console.log(fs.readdirSync(__dirname));
        let errorMessage = output?.errors
        ejs.renderFile(path.join(__dirname, 'src/error.ejs'), { errorMessage }, (err, html) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.send(html);
          }
        });
      } else {
        if (output?.success && output?.success[0]?.file) {
          res.sendFile(path.join(__dirname, output?.success[0]?.file));
        }
      }
      // res.sendFile(path.join(__dirname,"client.html"))
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });*/
