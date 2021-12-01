class Jeopardy {
    constructor(element, options={}) {
       this.useCategoryIds = options.useCategoryIds || [ 302, 486, 1838, 518]; 
       //Categories from https://jservice.io/search:
            
        //Database
       this.categories = [];
       this.clues = {};
       
       //State
       this.currentClue = null;
       this.score = 0;
       
       //Elements
       this.boardElement = element.querySelector(".board");
       this.scoreCountElement = element.querySelector(".score-count");
       this.formElement = element.querySelector("form");
       this.inputElement = element.querySelector("input[name=user-answer]");
       this.modalElement = element.querySelector(".card-modal");
       this.clueTextElement = element.querySelector(".clue-text");
       this.resultElement = element.querySelector(".result");
       this.resultTextElement = element.querySelector(".result_correct-answer-text");
       this.successTextElement = element.querySelector(".result_success");
       this.failTextElement = element.querySelector(".result_fail");
    }
 
    initGame() {
       //Bind event handlers
       this.boardElement.addEventListener("click", event => {
          if (event.target.dataset.clueId) {
             this.handleClueClick(event);
          }
       });
       this.formElement.addEventListener("submit", event => {
          this.handleFormSubmit(event);
       });
       
       
       //Show default score of 0
       this.updateScore(0);
       
       //Get categories
       this.fetchCategories();
    }
    
    fetchCategories() {      
       //Get data from API
       const categories = this.useCategoryIds.map(category_id => {
          return new Promise((resolve, reject) => {
             fetch(`https://jservice.io/api/category?id=${category_id}`)
                .then(response => response.json()).then(data => {
                   resolve(data);
                });
          });
       });
       
       //Sift through data when categories come back
       Promise.all(categories).then(results => {
          
          //Build list of categories
          results.forEach((result, categoryIndex) => {
             
             //Blank category
             var category = {
                title: result.title,
                clues: []
             }
             
             //Add clue within a category to database of clues
             var clues = shuffle(result.clues).splice(0,5).forEach((clue, index) => {
                console.log(clue)
                
                //Create ID for clue
                var clueId = categoryIndex + "-" + index;
                category.clues.push(clueId);
                
                //Add clue to database
                this.clues[clueId] = {
                   question: clue.question,
                   answer: clue.answer,
                   value: (index + 1) * 100
                };
             })
             
             //Add this category to database of categories
             this.categories.push(category);
          });
          
          //Render each category to the DOM
          this.categories.forEach((c) => {
             this.renderCategory(c);
          });
       });
    }
 
    renderCategory(category) {      
       let column = document.createElement("div");
       column.classList.add("column");
       column.innerHTML = (
          `<header>${category.title}</header>
          <ul>
          </ul>`
       ).trim();
       
       var ul = column.querySelector("ul");
       category.clues.forEach(clueId => {
          var clue = this.clues[clueId];
          ul.innerHTML += `<li><button data-clue-id=${clueId}>${clue.value}</button></li>`
       })
       
       //Add to DOM
       this.boardElement.appendChild(column);
    }
 
    updateScore(change) {
       this.score += change;
       this.scoreCountElement.textContent = this.score;
    }
 
    handleClueClick(event) {
       var clue = this.clues[event.target.dataset.clueId];
 
       //Mark button as used
       event.target.classList.add("used");
       
       //Clear input field
       this.inputElement.value = "";
       
       //Update current clue
       this.currentClue = clue;
 
       //Update the text
       this.clueTextElement.textContent = this.currentClue.question;
       this.resultTextElement.textContent = this.currentClue.answer;
 
       //Hide result
       this.modalElement.classList.remove("showing-result");
       
       //Show the modal
       this.modalElement.classList.add("visible");
       this.inputElement.focus();
    }
 
    //Handle an answer
    handleFormSubmit(event) {
       event.preventDefault();
       
       var isCorrect = this.cleanseAnswer(this.inputElement.value) === this.cleanseAnswer(this.currentClue.answer);
       if (isCorrect) {
          this.updateScore(this.currentClue.value);
       }
       
       //Show answer
       this.revealAnswer(isCorrect);
    }
    
    //Standardize an answer string to compare and accept variations
    cleanseAnswer(input="") {
       var friendlyAnswer = input.toLowerCase();
       friendlyAnswer = friendlyAnswer.replace("<i>", "");
       friendlyAnswer = friendlyAnswer.replace("</i>", "");
       friendlyAnswer = friendlyAnswer.replace(/ /g, "");
       friendlyAnswer = friendlyAnswer.replace(/"/g, "");
       friendlyAnswer = friendlyAnswer.replace(/^a /, "");
       friendlyAnswer = friendlyAnswer.replace(/^an /, "");      
       return friendlyAnswer.trim();
    }
    
    
    revealAnswer(isCorrect) {
       
       //Show the individual success/fail case
       this.successTextElement.style.display = isCorrect ? "block" : "none";
       this.failTextElement.style.display = !isCorrect ? "block" : "none";
       
       //Show result container
       this.modalElement.classList.add("showing-result");
       
       //Disappear after a bit
       setTimeout(() => {
          this.modalElement.classList.remove("visible");
       }, 2000);
    }
    
 }
 
 

 //Shuffle array in place
 function shuffle(a) {
     var j, x, i;
     for (i = a.length - 1; i > 0; i--) {
         j = Math.floor(Math.random() * (i + 1));
         x = a[i];
         a[i] = a[j];
         a[j] = x;
     }
     return a;
 } 
 

 const game = new Jeopardy( document.querySelector(".app"), {});
 game.initGame();