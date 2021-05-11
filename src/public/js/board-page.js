(function($) {

    // stays the same while on this page
    let boardId = $('#board-container').data('id');

    // ADDS THE ERROR HTML FOR RENDERING
    const displayErrorPage = err => {
        $('body').html($(err.responseText.match(/\<body[^>]*\>([^]*)\<\/body/m)[1]));
    };

    // CLICK CARD MODAL FUNCTIONALITY
    const setUpCardModal = ele => {
        $(ele).on('click', event => {
            event.preventDefault();
            
            let cardId = $(ele).data('id');
            $.ajax({
                method: 'GET',
                url: `/board/card/${boardId}/${cardId}`
            }).then(res => {
                let newElement = $(res);
                $('#listModal').hide();
                $('#cardModal').empty().append(newElement);
                setUpErrorChecking();
                $('#closeModal').on("click", (e) => {
                    e.preventDefault();
                    $('#cardModal').hide();
                });
                setUpDeleteCard();
                setUpGCal(cardId);
                setUpComments(cardId);
                setUpLabels(cardId);
                $('#cardModal').show();
            }, err => {
                displayErrorPage(err);
            });
        });
    };

    // give modal functionality to all card buttons.
    $('.card').each((ind, ele) => {
        setUpCardModal(ele);
    });

    // ERROR CHECKING FOR CARD MODAL
    // TODO: not completed yet, that will be my next job
    const setUpErrorChecking = () => {
        let updateCardForm = $("#updateCard");

        let oldCardName = $('#newCardName').val();
        let oldStoryPoints = parseInt($('#cardStoryPoints').val());
        let oldAssigned = updateCardForm.serializeArray()
                            .filter(ele => ele.name === 'members[]')
                            .map(ele => ele.value);
        let oldDescription = $('#cardDescription').val();
        let oldList = $('#toList').val();
        let oldPosition = $('#position').val();
        let oldDueDate = $('#dueDate').val();
        let oldDueTime = $('#dueTime').val();
        let oldDueDone = $('#dueDone').is(':checked');

        updateCardForm.submit(event => {
            event.preventDefault();

            // get new inputs
            let formData = updateCardForm.serializeArray();
            let cardName = formData[formData.findIndex(
                ele => ele.name === 'newCardName')].value;
            let storyPoints = formData[formData.findIndex(
                ele => ele.name === 'storyPoints')].value;
            let assigned = formData
                            .filter(ele => ele.name === 'members[]')
                            .map(ele => ele.value);
            if(assigned === undefined) assigned = [];
            let description = formData[formData.findIndex(
                ele => ele.name === 'description')].value;
            let toList = formData[formData.findIndex(
                ele => ele.name === 'toList')].value;
            let position = formData[formData.findIndex(
                ele => ele.name === 'position')].value;
            let dueDate = formData[formData.findIndex(
                ele => ele.name === 'dueDate')].value;
            let dueTime = formData[formData.findIndex(
                ele => ele.name === 'dueTime')].value;
            let dueDone = $('#dueDone').is(':checked');

            // error check the new inputs
            // https://stackoverflow.com/questions/18758772/how-do-i-validate-a-date-in-this-format-yyyy-mm-dd-using-jquery/18759013
            const validDate = date => {
                if(!date.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
                let d = new Date(date);
                let dNum = d.getTime();
                if(!dNum && dNum !== 0) return false;
                return d.toISOString().slice(0,10) === date;
            };
            if((cardName = cardName.trim()).length === 0) {
                alert('card must have a name');
                return;
            }
            if(storyPoints !== NaN && isNaN(+storyPoints) === NaN || (storyPoints = parseInt(storyPoints)) === NaN) {
                alert('storyPoints must be an integer');
                return;
            }
            if(storyPoints < 0 || storyPoints > 99) {
                alert('story points must be between 1 and 99. type 0 to remove them from this card.');
                return;
            }
            description = description.trim();
            if(isNaN(+position) === NaN || (position = parseInt(position)) === NaN) {
                alert('position must be an integer');
                return;
            }
            if(dueDate !== '' && !validDate(dueDate)) {
                alert('date must be a real date in the form yyyy-mm-dd');
                return;
            }
            if(dueDate !== '') {
                let dateParts = dueDate.split('-');
                dueDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
            }

            // date is either fully provided, or not at all
            if((dueDate === '' && dueTime !== '') 
            || dueTime === '' && dueDate !== '') {
                alert('must provide a date and time if giving a dueDate');
                return;
            }
            // if no date, cannot set 'done'
            if(dueDate === '' && dueTime === '' && dueDone) {
                alert('cannot set card to "done" without a due date.');
                return;
            }
            // check if anything was actually updated

            // https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
            const arrayEquals = (a, b) => {
                if (a === b) return true;
                if (a == null || b == null) return false;
                if (a.length !== b.length) return false;
                for (var i = 0; i < a.length; ++i)
                    if (a[i] !== b[i]) return false;
                return true;
            };

            if(oldCardName === cardName
            && Object.is(oldStoryPoints, storyPoints)
            && arrayEquals(oldAssigned, assigned)
            && oldDescription === description
            && oldList === toList
            && +oldPosition === position
            && ((dueDate === '' && oldDueDate === '')
            || (oldDueDate === new Date(dueDate).toISOString().substring(0, 10)))
            && oldDueTime === dueTime
            && oldDueDone === dueDone) {
                alert('nothing to change!');
                return;
            }

            // trim data being sent to only new stuff
            if(assigned.length === 0) assigned = '';
            if(oldCardName === cardName) cardName = undefined;
            if(Object.is(oldStoryPoints, storyPoints)) storyPoints = undefined;
            if(arrayEquals(oldAssigned, assigned)) assigned = undefined;
            else if(assigned.length === 0) assigned = '';
            if(oldDescription === description) description = undefined;
            if(oldList === toList) toList = undefined;
            if(+oldPosition === position) position = undefined;
            if(((dueDate === '' && oldDueDate === '')
            || (oldDueDate === new Date(dueDate).toISOString().substring(0, 10)))) dueDate = undefined;
            if(oldDueTime === dueTime) dueTime = undefined;
            if(oldDueDone === dueDone) dueDone = undefined;

            // input is good, ready for ajax
            $.ajax({
                method: 'PATCH',
                url: updateCardForm.attr('action'),
                data: { 
                    cardName: cardName,
                    storyPoints: storyPoints,
                    description: description,
                    date: dueDate,
                    time: dueTime,
                    done: dueDone,
                    assigned: assigned,
                    list: toList,
                    position: position
                 }
            }).then(res => {
                window.location.href = `/board/${$(res)[0].boardId}`; 
            }, err => displayErrorPage(err));
        });
    }

    // DELETE CARD FROM MODAL
    const setUpDeleteCard = () => {
        let deleteButton = $("#deleteCard");
        deleteButton.on("click", (e) => {
            e.preventDefault();

            let cardId = deleteButton.data('id');
            let requestData = {
                method: "POST",
                url: `/board/delete/card/${boardId}/${cardId}`
            };
            //make the call to ajax to delete card
            $.ajax(requestData)
            .then(res => {
                window.location.href = `/board/${boardId}`;
            }, err => {
                displayErrorPage(err);
            });
        })
    };

    const setUpGCal = (cardId) => {
        let gcal_btn = $('#gcal-btn');
        gcal_btn.on("click", (e) => {
            e.preventDefault();

            let requestData = {
                method: "GET",
                url: `/board/gcal/${boardId}/${cardId}`
            };
            $.ajax(requestData).then(function(responseMessage) {
                window.open(responseMessage.link, "_blank");
            }, err => displayErrorPage(err));
        });
    }

    // OPEN COMMENTS MODAL
    const setUpComments = (cardId) => {
        //handle the comment button being clicked
        let openComments = $('#openComments');
        let placeCommentsHere = $('#placeCommentsHere');

        openComments.on("click", (e) => {
            e.preventDefault();
            $('#placeLabelsHere').hide();

            let requestData = {
                method: "GET",
                url: `/board/card/comments/${boardId}/${cardId}`
            };
            $.ajax(requestData).then(function(responseMessage) {
                let commentModal = $(responseMessage);
                placeCommentsHere.empty(); //handle a modal being there before
                placeCommentsHere.append(commentModal); //insert new modal
                setUpCommentErrorChecking();
                setUpCloseComment();
                placeCommentsHere.show();
            }, err => displayErrorPage(err));
        });
    };

    // CLOSE THE COMMENT MODAL
    const setUpCloseComment = () => {
        let btn = $('#close-comment-btn');
        btn.on('click', event => {
            event.preventDefault();
            $('#placeCommentsHere').hide();
        })
    }

    // ERROR CHECKING FOR COMMENTS MODAL
    const setUpCommentErrorChecking = () => {
        let form = $('#comment-form');
        form.submit(event => {
            event.preventDefault();
            try {
                let formData = form.serializeArray();
                let comment = formData[formData.findIndex(
                ele => ele.name === 'comment')].value;
                if(comment.trim().length === 0)
                    throw new Error("Comment must not be empty");
                $.ajax({
                    method: 'PUT',
                    url: form.attr('action'),
                    data: { comment: comment }
                }).then(res => {
                    const resJson = $(res)[0];
                    const newCommentHTML = $('<div>')
                    .attr('class', 'comment-container')
                    .append($('<h3>')
                        .attr('class', 'comment-initials')
                        .attr('style', `background-color: ${resJson.color}`)
                        .text(resJson.initials))
                    .append($('<p>')
                        .attr('class', 'comment-content')
                        .text(resJson.comment));
                        newCommentHTML.insertBefore($('#comment-form'));
                }, err => displayErrorPage(err));
            } catch (error) {
                event.preventDefault();
                alert('must input a comment to add a comment');
            }
            $("input:text").val("");
        });
    };

    // OPEN LABELS MODAL
    const setUpLabels = (cardId) => {
        let openLabels = $('#openLabels');
        let placeLabelsHere = $('#placeLabelsHere');

        openLabels.on('click', event => {
            event.preventDefault();
            $('#placeCommentsHere').hide();
            let requestData = {
                method: "GET",
                url: `/board/card/labels/${boardId}/${cardId}`
            };
            $.ajax(requestData).then(function(responseMessage) {
                let labelModal = $(responseMessage);
                placeLabelsHere.empty(); //handle a modal being there before
                placeLabelsHere.append(labelModal); //insert new modal
                let closeLabelModal = $('#close-edit-labels');
                closeLabelModal.on("click", (e) => {
                    e.preventDefault();
                    placeLabelsHere.empty();
                    placeLabelsHere.hide();
                });
                setUpLabelErrorChecking();
                placeLabelsHere.show();
            }, err => displayErrorPage(err));
        });
    };

    // ERROR CHECKING FOR LABELS MODAL
    const setUpLabelErrorChecking = () => {
        let labelsForm = $('#editLabels');
        let originalLabelLength = labelsForm.serializeArray().filter(ele => ele.name === 'labels[]').length;

        labelsForm.submit(event => {
            event.preventDefault();

            // grab the data from the form.
            let formData = labelsForm.serializeArray();
            let newLabel = formData[formData.findIndex(
                ele => ele.name === 'add_label_name')].value;  
            let labels = [];
            let labelArray = formData.filter(ele => ele.name === 'labels[]');
            labelArray.forEach(ele => labels.push(ele.value));

            // check if any updating happened
            if(labels.length === originalLabelLength && newLabel.trim().length === 0)
                alert('no labels to change!');
            else {
                if(labels.length === 0)
                    labels = '';
                $.ajax({
                    method: "PATCH",
                    url: labelsForm.attr('action'),
                    data: { labelIds: labels, newLabelName: newLabel }
                }).then(res => {
                    const resJson = $(res)[0];
                    const updatedLabels = resJson.labelsInfo;

                    // update the labels displayed in the modal
                    $('#list-of-labels').empty();
                    for(let i = 0; i < updatedLabels.length; i++)
                        $('#list-of-labels')
                        .append($('<div>')
                            .attr('class', 'label-input-container')
                            .append($('<input>')
                                .attr('type', 'checkbox')
                                .attr('id', `card_label_${i}`)
                                .attr('name', 'labels[]')
                                .attr('value', updatedLabels[i]._id)
                                .prop('checked', true))
                            .append($('<label>')
                                .attr('for', `card_label_${i}`)
                                .append($('<p>')
                                    .attr('class', 'card-label-highlight')
                                    .attr('style', `background-color: ${updatedLabels[i].color};`)
                                    .text(''))
                                .append(updatedLabels[i].text)));

                    let cardId = labelsForm.attr('action').substring(labelsForm.attr('action').lastIndexOf('/') + 1);
                    
                    // update the labels displayed on the card
                    let cardLabelsDiv = $(`div[class=labels-list][data-id=${cardId}]`);
                    cardLabelsDiv.empty();
                    for(let i = 0; i < updatedLabels.length; i++)
                        cardLabelsDiv
                        .append($('<p>')
                            .attr('class', 'card-label-highlight')
                            .attr('style', `background-color: ${updatedLabels[i].color};`));

                    // update the originalLabelLength to maintain knowledge of when changes are made
                    originalLabelLength = updatedLabels.length;
                    
                }, err => displayErrorPage(err));
            }
            $("input:text").val("");
        });
    };

    // GO TO BOARD SETTINGS
    let boardSettingsBtn = $('#board-settings-btn');
    boardSettingsBtn.on('click', event => {
        window.location.href = `/board/settings/${boardSettingsBtn.data('id')}`;
    });

    // DOWNLOAD CALENDAR
    let downloadCalendarBtn = $('#download-calendar-btn');
    downloadCalendarBtn.on('click', event => {
        event.preventDefault();
        window.location.href = `/board/calendar/${downloadCalendarBtn.data('id')}`;
    });

    // ADD NEW CARD
    const setUpAddNewCard = (ele) => {
        $(ele).on('submit', event => {
            event.preventDefault();

            try {
                let formData = $(ele).serializeArray();
                let cardName = formData[formData.findIndex(
                    elem => elem.name === 'cardName')].value;
                if(cardName !== undefined) {
                    cardName = cardName.trim();
                    if(cardName.length !== 0) {
                        $.ajax({
                            method: 'POST',
                            url: $(ele).attr('action'),
                            data: {cardName: cardName}
                        }).then(res => {
                            const resJson = $(res)[0];
                            // it worked, add the list to the html
                            const newCardHTML = $('<button>')
                            .attr('class', 'card')
                            .attr('data-id', resJson.cardId)
                            .append($('<div>')
                                .attr('class', 'card-header')
                                .append($('<div>')
                                    .attr('class', 'labels-list'))
                                .append($('<p>')
                                    .attr('class', 'card-story-points')))
                            .append($('<div>')
                                .attr('class', 'card-body')
                                .append($('<p>')
                                    .attr('class', 'card-name')
                                    .text(resJson.cardName)));
                            setUpCardModal(newCardHTML[0]);
                            newCardHTML.insertBefore($(ele));
                        }, err => {
                            displayErrorPage(err);

                        }); 
                        $("input:text").val("");
                    } else {
                        alert('must input a name to add a card');
                    }
                } else {
                    alert('must input a name to add a card');
                }
            } catch(e) {
                alert('must input a name to add a card');
            }
        });
    };

    // give functionality to all add card buttons.
    $('.new-card').each((ind, ele) => {
        setUpAddNewCard(ele);
    });

    // EDIT LIST MODAL FUNCTIONALITY
    const setUpListModal = (ele) => {
        $(ele).on('click', event => {
            event.preventDefault();

            let listId = $(ele).data('id');
            $.ajax({
                method: 'GET',
                url: `/board/list/${boardId}/${listId}`
            }).then(res => {
                let newElement = $(res);
                $('#cardModal').hide();
                $('#listModal').empty().append(newElement).show();
                setUpListForm();
                setUpCloseEditList();
            }, err => {
                displayErrorPage(err);
            });
        });
    }

    // give modal functionality to all edit list buttons.
    $('.edit-list-btn').each((ind, ele) => {
        setUpListModal(ele);
    });

    // ADD NEW LIST
    let addListForm = $('#new-list');
    addListForm.submit(event => {
        event.preventDefault();

        try {
            let formData = addListForm.serializeArray();
            let listName = formData[formData.findIndex(
                ele => ele.name === 'listName')].value;

            if(listName !== undefined) {
                listName = listName.trim();
                if(listName.length !== 0) {
                    $.ajax({
                        method: 'POST',
                        url: window.location.href,
                        data: {listName: listName}
                    }).then(res => {
                        const resJson = $(res)[0];
                        const newListHTML = $('<div>')
                        .attr('class', 'list')
                        .append($('<div>')
                            .attr('class', 'list-header')
                            .append($('<p>')
                                .attr('class', 'board-list-name')
                                .text(resJson.listName))
                            .append($('<button>')
                                .attr('class', 'edit-list-btn')
                                .attr('type', 'button')
                                .text('edit list')
                                .attr('data-id', resJson.listId)))
                        .append($('<div>')
                            .attr('class', 'list-body')
                            .append($('<form>')
                                .attr('class', 'new-card')
                                .attr('method', 'POST')
                                .attr('action', `/board/${resJson.boardId}/${resJson.listId}`)
                                .append($('<label>')
                                    .append($('<p>')
                                        .text('Card')
                                        .hide())
                                    .append($('<input>')
                                        .attr('type', 'text')
                                        .attr('name', 'cardName')
                                        .attr('class', 'new-card-name-input')
                                        .prop('required',true)))
                                .append($('<button>')
                                    .attr('class', 'add-card-btn')
                                    .attr('type', 'submit')
                                    .text('add card'))));

                        setUpAddNewCard(newListHTML.find('form')[0]);
                        setUpListModal($(newListHTML.find('div')[0]).find('button')[0]);
                        newListHTML.insertBefore($('#new-list'));
                    }, err => {
                        displayErrorPage(err);
                    });
                    $("input:text").val("");
                } else {
                    // Bad Request client-side error
                    alert('must input a name to add a list');
                }
            } else {
                // Bad Request client-side error
                alert('must input a name to add a list');
            }
        } catch(e) {
            // Bad Request client-side error
            alert('must input a name to add a list');
        }
    });

    // EDIT LIST FORM SUBMISSION
    const setUpListForm = () => {
        let editListForm = $('#editListForm');
        let prevListName = $('#listName');
        let prevListPosition = $('#positionValue');

        editListForm.submit(event => {
            event.preventDefault();

            // get inputs
            let formData = editListForm.serializeArray();
            let listName = formData[formData.findIndex(x => x.name === 'listName')].value;
            let position = formData[formData.findIndex(x => x.name === 'position')].value;

            // error check inputs
            if((listName = listName.trim()).length === 0) {
                alert('list must have a name');
                return;
            }
            if(isNaN(+position) === NaN || (position = parseInt(position)) === NaN) {
                alert('position must be an integer');
                return;
            }

            // make sure a new update is coming in
            if(prevListName === listName && prevListPosition === position) {
                alert('nothing to change.');
                return;
            }

            // inputs are good, make the request
            $.ajax({
                method: 'POST',
                url: editListForm.attr('action'),
                data: { listName: listName, position: position }
            }).then(res => {
                window.location.href = `/board/${$(res)[0].boardId}`;
            }, err => displayErrorPage(err));
        });
    };

    // CLOSE EDIT LIST MODAL
    const setUpCloseEditList = () => {
        let closeBtn = $('#close-list-settings-btn');
        closeBtn.on('click', event => {
            $('#listModal').hide();
        })
    };
    

})(window.jQuery);
