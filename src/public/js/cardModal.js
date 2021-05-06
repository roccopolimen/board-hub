(function($) {
    //this file should be imported into the board handlebars file
    //this variable should be the <div> that the modal is going to be inserted in to
    let placeModalHere = $("#placeModalHere");

    //this will select every element with an href = populateCard.html;
    //<a href="/populateCard.html" id="_id of the card">
    let cards = $("[href=populateCard.html]");
    for(let x of cards) {
        let cardId = x.id; //this is why the id needs to be the id of the card
        let boardId = "TODO"; //I need to get the boardId somehow, since I imagine that's how it works in the routes
        x.on('click', (e) => {
            e.preventDefault(); //prevents redirect
            let requestData = {
                method: "POST", //I think?
                url: `TODO/${boardId}/${cardId}` //TODO: Insert route to get info
            };
            //make the call to ajax to populate
            $.ajax(requestData).then(function(responseMessage) {
                let cardModal = $(responseMessage);
                placeModalHere.empty(); //handle a modal being there before
                placeModalHere.append(cardModal); //insert new modal
                setUpErrorChecking();
                setUpDeleteCard();
                setUpComments(boardId, cardId);
                setUpLabels();
                placeModalHere.show();
            });
        });
    }

    //error checking the form
    const setUpErrorChecking = () => {
        let form = $("#updateCard");
        form.on("submit", (e) => {
            try {
                let position = $('#position');
                let toList = $('#toList');
                let description = $('#description');
                if(position == null || toList == null || description == null) throw new Error("Internal Variable Error");
                if(position.val() == null || toList.val() == null) throw new Error("All inputs must have values.");
                return true;
            } catch (error) {
                e.preventDefault();
                return false;
            }
        });
    }

    //delete card
    const setUpDeleteCard = () => {
        let deleteButton = $("deleteCard");
        deleteButton.on("click", (e) => {
            e.preventDefault();
            let requestData = {
                method: "POST",
                url: `TODO/${boardId}/${cardId}` //TODO: Insert route to delete card
            };
            //make the call to ajax to delete card
            $.ajax(requestData);
        })
    }

    const setUpComments = (boardId, cardId) => {
        //handle the comment button being clicked
        let openComments = $('#openComments');
        let placeCommentsHere = $('#placeCommentsHere');

        openComments.on("click", (e) => {
            e.preventDefault();
            let requestData = {
                method: "GET", //I think?
                url: `card/comments/${boardId}/${cardId}` //TODO: Check this route
            };
            $.ajax(requestData).then(function(responseMessage) {
                let commentModal = $(responseMessage);
                placeCommentsHere.empty(); //handle a modal being there before
                placeCommentsHere.append(commentModal); //insert new modal
                setUpCommentErrorChecking();
                placeCommentsHere.show();
            });
        })
    }

    const setUpCommentErrorChecking = () => {
        let form = $('#comment-form');
        
        form.on('submit', (e) => {
            try {
                let comment = $('#commentInput');
                if(comment.trim() == '') throw new Error("Comment must not be empty");
            } 
            catch (error) {
                e.preventDefault();
                return false;    
            }
        });
    }

})(window.jQuery);