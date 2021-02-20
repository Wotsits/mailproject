document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});








//CUSTOM FUNCTIONS START HERE

function sendemail() {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })

  load_mailbox('inbox')
};

/////////////////////////////////

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#selected-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  //reset navs styling
  reset_navs()
  
  // Highlight nav item
  document.querySelector(`#compose`).style.backgroundColor = "rgb(24, 27, 38";

}

/////////////////////////////////

//This function resets all nav items to standard background colour before highlighting the selected nav item. 
function reset_navs() {
  document.querySelectorAll('.navitem').forEach(element => {
    element.style.backgroundColor = 'rgb(32, 36, 49)';
  });
}

/////////////////////////////////


function loademails(mailbox) {
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    
    // loop that iterates through the items returned and clreates a div element for each email.  
    let i;
    for (i = 0; i < emails.length; i++) {
      // creates the div.
      const emaildiv = document.createElement('div');
      
      // extracts info about each email for use later.
      const id = emails[i].id
      const readstatus = emails[i].read
      let emailaddress = ''
      if (mailbox === "sent") {
        emailaddress = emails[i].recipients
      } else {
        emailaddress = emails[i].sender
      }
      
      // set class of emaildiv based on 'read' status of the email.
      if (emails[i].read) {
        emaildiv.className = "email reademail"
      } else {
        emaildiv.className = "email unreademail"
      }

      // sets the inner HTML for the emaildiv.
      emaildiv.innerHTML = `<p class="emailaddress">${emailaddress}</p><p class="timestamp">${emails[i].timestamp}</p><p class="subject">${emails[i].subject}</p>`;
      
      // add event listener to the email div.
      emaildiv.addEventListener('click', function(event) {

        // first resets all email div borders to default
        document.querySelectorAll('.email').forEach(element => {
          element.style.border = '1px solid rgb(246, 247, 250)'
        })

        // then sets the chosen email div to highlighted border
        this.style.border = '1px solid rgb(255, 0, 45)'
        this.style.borderLeft = '4px solid rgb(255, 0, 45)'
        
        // fetch behavior involked by click event on the email div.
        fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {

          // grab some key bits of info that are used later.
          const emailsender = email.sender
          const emailsubject = email.subject
          const emailbody = email.body
          const emailtimestamp = email.timestamp

          // creates messagedetail div
          const messagedetail = document.createElement('div');
          messagedetail.className = "messagedetail";
          messagedetail.innerHTML = `
            <div class="messageheader">
              <h4>${email.subject}</h4>
              <div class="messagesubheader">
                <span class="subheadergroup">
                  <p class="label">from:</p>
                  <p class="data">${email.sender}</p>
                </span>
                <span class="subheadergroup">
                  <p class="label">to:</p>
                  <p class="data">${email.recipients}</p>
                </span>
                <span class="subheadergroup">
                  <p class="label">date:</p>
                  <p class="data">${email.timestamp}</p>
                </span>
              </div>
            </div>
            <div class="messagecontent">
              <p>${email.body}</p>
            </div>`
          
          // clear the selected-email-view div
          document.querySelector('#selected-email-view').innerHTML = '';
          document.querySelector('#selected-email-view').append(messagedetail);
          document.querySelector('#selected-email-view').style.display = 'block';
          
          //////// ARCHIVE BUTTON FUNCTIONALITY ////////

          // create the archive/unarchive button
          archivebutton = document.createElement('span')
          archivebutton.className = "archivebutton"

          if (email.archived) {
            archivebutton.setAttribute("id", "unarchive")
            archivebutton.innerHTML = "<i class='fas fa-folder-minus'></i><p>Remove from Archive</p>"
            archivebutton.addEventListener('click', function() {
              // remove from archive function 
              fetch(`/emails/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  archived: false
                })
              })
              // this waits until the PUT request is over, then reloads the mailbox.  Without this, the mailbox reloads before the PUT request is complete. 
              .then(response => {
                document.querySelector('#selected-email-view').style.display = 'none';
                load_mailbox("inbox")
              })
            })
          } else {
            archivebutton.setAttribute("id", "archive")
            archivebutton.innerHTML = '<i class="fas fa-folder-plus"></i><p>Add to Archive</p>'
            archivebutton.addEventListener('click', function() {
              // add to archive function 
              fetch(`/emails/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  archived: true
                })
              })
              // this waits until the PUT request is over, then reloads the mailbox.  Without this, the mailbox reloads before the PUT request is complete. 
              .then(response => {
                document.querySelector('#selected-email-view').style.display = 'none';
                load_mailbox("inbox")
              })
            })  
          }

          ///////// END OF ARCHIVE FUNCTIONALITY /////////

          ///////// REPLY BUTTON FUNCTIONALITY ///////////

          replybutton = document.createElement('span')
          replybutton.className = "replybutton"
          replybutton.setAttribute("id", "replybutton")
          replybutton.innerHTML = "<i class='fas fa-reply'></i><p>Reply</p>"
          replybutton.addEventListener('click', function() {
            load_mailbox("compose")
            document.querySelector('#compose-view').style.display = 'block'
            document.querySelector('#compose-recipients').value = `${emailsender}`
            document.querySelector('#compose-subject').value = `${emailsubject}`
            document.querySelector('#compose-body').value = `\n\nOn ${emailtimestamp}, ${emailsender} wrote:\n\n ${emailbody}`
          })

          ///////// END OF REPLY FUNCTIONALITY ///////////

          // adds both archive and reply buttons to #selected-email-view div
          emailviewbuttons = document.createElement('div')
          emailviewbuttons.className = "email-view-buttons"
          document.querySelector('#selected-email-view').append(emailviewbuttons);
          document.querySelector('.email-view-buttons').append(replybutton);
          document.querySelector('.email-view-buttons').append(archivebutton);
          
        })


        // sets email read status to true when the item is clicked on. 
        if (!readstatus) {
          fetch(`/emails/${id}`, {
            method:'PUT',
            body: JSON.stringify({
              read: true
            })
          })
          .then(response => {
            this.className = "email read"
          })
          }
      });

      // add the element to the #emails-view div 
      document.querySelector("#emails-view").append(emaildiv);  
    }
  })
};

function load_mailbox(mailbox) {

  document.querySelector('#emails-view').innerHTML = '';
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#selected-email-view').style.display = 'none';
  
  //reset navs styling
  reset_navs()
  
  // Highlight nav item
  document.querySelector(`#${mailbox}`).style.backgroundColor = "rgb(24, 27, 38";

  //call to load emails.
  loademails(mailbox);
}