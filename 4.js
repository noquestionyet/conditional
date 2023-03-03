/* eslint-disable semi */
/* attributes are used
-- required
1. nqy-step="step-n" - number of step
2. nqy-action="next" - next button (even if conditional step, every next button should has this!!!)
3. nqy-action="previous" - previous button

4. nqy-destination="step-n" - show what is the next step
nqy-destination="final" -show results
5. nqy-conditional="step-conditional" - if the next step depends on a chosen option
6. nqy-destination="step-n" - set to the radio buttons in conditional logic (real radio buttons)

nqy-form-active radio button active class
nqy-input-error - error class

7. nqy-form="form" - main form
8. nqy-points="40" -amount of points for each answer (add to radio button)

9. nqy-text="source-n" - reuse the input content
10. nqy-text="target-n"
11. nqy-text-button="activator-n"

--final steps
12. nqy-step="final" - every screen with the result
13. nqy-range-from="40" - start of the range to show this result
14. nqy-range-to="100" - end of the range to show this result
*/

// main variables
let filledState = true;
const apirUrl = 'https://api.noquestionyet.com/api:84zPS-li';
const paidPlanId = 'prc_deploy-plan-n4ae053s';
let userStatus = false;

// checking the subscription status in the db
function getMemberStatus (currentUserId) {
  let activeStatus = true;
  const currentMember = fetch(`${apirUrl}/member/${currentUserId}`);
  currentMember.then(response => {
    if (response.ok) {
      return response.json();
    } else {
      return response.json().then((text) => {
        throw new Error(text);
      })
    }
  }).then(data => {
    const expirationDate = data.memberstack_expiration_date;
    const currentDate = Math.floor(Date.now() / 1000);
    const currentUserPriceId = data.price_id;
    if (currentUserPriceId === paidPlanId) {
      expirationDate && currentDate > expirationDate ? activeStatus = false : activeStatus = true;
    } else {
      activeStatus = false;
    }
    activateScript(activeStatus);
  }).catch(error => {
    showError(error.message);
  })
}

// checking the status of the subscription and setting the main variables based on that
function activateScript (activeStatus) {
  const currentURL = window.location.hostname;
  currentURL.includes('webflow.io') ? userStatus = true : userStatus = activeStatus;
  setForms(userStatus);
}

// hiding all questions apart from the first
function setForms (userStatus) {
  const quizForms = document.querySelectorAll('[nqy-form]');
  if (userStatus === true) {
    quizForms.forEach((quizForm) => {
      const questionSteps = quizForm.querySelectorAll('[nqy-step]');
      for (let i = 0; i < questionSteps.length; i++) {
        questionSteps[i].style.display = 'none';
        if (i === 0) {
          questionSteps[i].style.display = 'block';
          questionSteps[i].classList.add('current-question');
          checkRequiredFields(questionSteps[i]);
        }
      }
    })
  } else { showError('Please, upgrade the plan'); }
}

// every time the new question appears, check if there are required fields
// call validatation func on every input change
function checkRequiredFields (currentQuestion) {
  const requiredFields = currentQuestion.querySelectorAll('[required]');
  if (requiredFields.length !== 0) {
    currentQuestion.querySelector('[nqy-action="next"]').style.opacity = '0.6';
    filledState = false;
    requiredFields.forEach((requiredField) => {
      requiredField.addEventListener('input', function () {
        validationState(requiredField, currentQuestion);
      })
    })
  }
}

// validate if required fields were filled
const validationState = (requiredField, currentQuestion) => {
  if (requiredField.type === 'radio' || requiredField.type === 'checkbox') {
    requiredField.checked ? (filledState = true, requiredField.classList.remove('nqy-input-error')) : filledState = false;
  } else if (requiredField.type === 'email') {
    const emailLowerCase = requiredField.value.toLowerCase();
    const emailMatch = emailLowerCase.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    emailMatch ? (filledState = true, requiredField.classList.remove('nqy-input-error')) : filledState = false;
  } else {
    requiredField.value ? (filledState = true, requiredField.classList.remove('nqy-input-error')) : filledState = false;
  }
  const currentQuestionNextButton = currentQuestion.querySelector('[nqy-action="next"]');
  filledState === true ? currentQuestionNextButton.style.opacity = '1' : currentQuestionNextButton.style.opacity = '0.6';
  return filledState;
}

// higlight required fields
function requiredFileds (currentQuestion) {
  const requiredFields = currentQuestion.querySelectorAll('[required]');
  for (let i = 0; i < requiredFields.length; i++) {
    if (requiredFields[i].type === 'radio' || requiredFields[i].type === 'checkbox') {
      !requiredFields[i].checked ? requiredFields[i].classList.add('nqy-input-error') : null;
    } else if (requiredFields.type === 'email') {
      const emailLowerCase = requiredFields.value.toLowerCase();
      const emailMatch = emailLowerCase.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
      !emailMatch ? requiredFields[i].classList.add('nqy-input-error') : null;
    } else {
      !requiredFields.value ? requiredFields[i].classList.add('nqy-input-error') : null;
    }
  }
}

// call next question function on each "next question" button click
const nextButtons = document.querySelectorAll('[nqy-action="next"]');
if (nextButtons.length !== 0) {
  nextButtons.forEach((el) => {
    el.addEventListener('click', () => {
      const quizForm = el.closest('[nqy-form]');
      console.log(quizForm)
      const nextStepNumber = el.getAttribute('nqy-destination');
      const stepConditional = el.getAttribute('nqy-conditional');
      const stepCopyTarget = el.getAttribute('nqy-text-button');
      //const stepCopyTargetNumber = stepCopyTarget.replace('activator-', '')
      nextStepNumber ? nextQuestion(nextStepNumber, quizForm) : null;
      stepConditional ? findNextQuestion(el) : null;
      //stepCopyTargetNumber ? addCustomContent(stepCopyTargetNumber) : null;
    })
  })
}

// call previous question function on each "previous question" button click
const previousButtons = document.querySelectorAll('[nqy-action="previous"]')
if (previousButtons.length !== 0) {
  previousButtons.forEach((el) => {
    const quizForm = el.closest('[nqy-form]');
    el.addEventListener('click', function () {
      previousQuestion(quizForm);
    })
  })
}

// show next question
function nextQuestion (stepNumber, quizForm) {
  const currentQuestion = quizForm.querySelector('.current-question');
  if (filledState) {
    savePoints(currentQuestion);
    const existingStepFlow = sessionStorage.getItem('stepFlow');
    existingStepFlow ? sessionStorage.setItem('stepFlow', `${existingStepFlow},${stepNumber}`) : sessionStorage.setItem('stepFlow', `step-1,${stepNumber}`);
    currentQuestion.classList.remove('current-question');
    currentQuestion.style.display = 'none';
    if (stepNumber === 'final') {
      showResult();
    } else {
      const nextQuestion = quizForm.querySelector(`[nqy-step='${stepNumber}']`);
      nextQuestion.classList.add('current-question');
      nextQuestion.style.display = 'block';
      checkRequiredFields(nextQuestion);
    }
  } else { requiredFileds(currentQuestion) }
}

// show conditional next question
function findNextQuestion (currentQuestionNextButton) {
  const currentQuestion = currentQuestionNextButton.closest('[nqy-step]');
  const radioButtons = currentQuestion.querySelectorAll('input[type="radio"]');
  for (let i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked) {
      const stepNumber = radioButtons[i].getAttribute('nqy-destination');
      const quizForm = radioButtons[i].closest('[nqy-form]');
      nextQuestion(stepNumber, quizForm);
    }
  }
}

// show previous question
function previousQuestion (quizForm) {
  const existingStepFlow = sessionStorage.getItem('stepFlow');
  const existingStepFlowArray = existingStepFlow.split(',');
  const previousQuestionNumber = existingStepFlowArray.at(-2);
  const previousQuestion = quizForm.querySelector(`[nqy-step='${previousQuestionNumber}']`);
  const currentQuestion = quizForm.querySelector('.current-question');
  previousQuestion.classList.add('current-question');
  previousQuestion.style.display = 'block';
  currentQuestion.classList.remove('current-question');
  currentQuestion.style.display = 'none';
  const newStepFlowArray = existingStepFlowArray.splice(-1)
  const newStepFlow = newStepFlowArray.toString();
  sessionStorage.setItem('stepFlow', `${newStepFlow}`);
  deletePoints();
}

// if we have points, add points results to the sessionStorage
function savePoints (currentQuestion) {
  let currentQuestionPointNumber = 0;
  const currentQuestionPoints = currentQuestion.querySelectorAll('[nqy-points]');
  if (currentQuestionPoints) {
    currentQuestionPoints.forEach((currentQuestionPoint) => {
      if (currentQuestionPoint.type === 'radio' && currentQuestionPoint.checked) {
        const currentQuestionPointAttribute = Number(currentQuestionPoint.getAttribute('nqy-points'));
        currentQuestionPointNumber = currentQuestionPointAttribute;
      }
    })
    const existingPoints = sessionStorage.getItem('points');
    if (existingPoints) {
      return sessionStorage.setItem('points', `${existingPoints},${currentQuestionPointNumber}`);
    }
    return sessionStorage.setItem('points', `${currentQuestionPointNumber}`);
  }
}

// if we have points results, delete them from sessionStorage
function deletePoints () {
  const existingPoints = sessionStorage.getItem('points');
  if (existingPoints) {
    const existingPointsArray = existingPoints.split(',');
    const newPointsArray = existingPointsArray.splice(-1)
    const newPoints = newPointsArray.toString();
    sessionStorage.setItem('points', `${newPoints}`);
  }
}

// if we have points show the custom result message
function showResult () {
  const resultScreens = document.querySelectorAll('[nqy-step="final"]');
  if (resultScreens.length === 1) {
    document.querySelectorAll('[nqy-step="final"]').item(0).style.display = 'block';
  } else {
    const pointFinalSum = pointSum();
    for (let i = 0; i < resultScreens.length; i++) {
      const minRange = Number(resultScreens[i].getAttribute('nqy-range-from'));
      const maxRange = Number(resultScreens[i].getAttribute('nqy-range-to'));
      minRange <= pointFinalSum && pointFinalSum <= maxRange ? resultScreens[i].style.display = 'block' : null;
    }
  }
}

// get the sum of the points
function pointSum () {
  const pointString = sessionStorage.getItem('points');
  const pointArray = pointString.split(',');
  let pointSum = 0;
  for (let i = 0; i < pointArray.length; i++) {
    !isNaN(pointArray[i]) ? pointSum += Number(pointArray[i]) : null;
  }
  return pointSum;
}

// if we have personalised content, like name, to reuse in the form text
function addCustomContent (stepCopyTargetNumber) {
  /*let sourceTextAttribute = '[nqy-text="source"]';
  let targetTextAttribute = '[nqy-text="target"]';
  if (stepCopyTargetNumber) {
    sourceTextAttribute = `[nqy-text="source-${stepCopyTargetNumber}"]`;
    targetTextAttribute = `[nqy-text="target-${stepCopyTargetNumber}"]`;
  }
  const sourceText = document.querySelector(`${sourceTextAttribute}`);
  const targetText = document.querySelector(`${targetTextAttribute}`);
  if (sourceText.value) {
    targetText.innerHTML = sourceText.value;
  }*/
}

// custom active class for radio buttons and checkboxed
const radioButtonsAll = document.querySelectorAll('input[type="radio"]');
radioButtonsAll.forEach((el) => {
  el.addEventListener('click', () => {
    for (let i = 0; i < radioButtonsAll.length; i++) {
      radioButtonsAll[i].parentElement.classList.remove('nqy-form-active');
    }
    el.parentElement.classList.add('nqy-form-active');
  })
})

// custom error display
function showError (value) {
  const toastWrapper = document.createElement('div');
  toastWrapper.className = 'toast-wrapper';
  toastWrapper.style.position = 'fixed';
  toastWrapper.style.right = '0%';
  toastWrapper.style.left = '0%';
  toastWrapper.style.bottom = '0%';
  toastWrapper.style.padding = '1.5rem';
  const toastMessage = document.createElement('div');
  toastMessage.className = 'toast-message';
  toastMessage.style.maxWidth = '30rem';
  toastMessage.style.backgroundColor = '#CC0000';
  toastMessage.style.color = '#ffffff';
  toastMessage.style.padding = '1.5rem';
  toastMessage.style.textAlign = 'center';
  toastMessage.style.margin = 'auto';
  toastMessage.innerHTML = value;
  toastWrapper.appendChild(toastMessage);
  document.body.appendChild(toastWrapper);
  setTimeout(function () {
    toastWrapper.style.display = 'none'
  }, 1800)
}

// clear session storage on load
window.onload = () => {
  const currentUserId = document.querySelector('script[data-quiz-id]').getAttribute('data-quiz-id');
  getMemberStatus(currentUserId);
  sessionStorage.clear();
}
