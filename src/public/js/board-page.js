(function($) {

    let boardId = $('#board-container').data('id');

    // CLICK CARD MODAL FUNCTIONALITY
    $('.card').each((ind, ele) => {
        $(ele).on('click', event => {
            event.preventDefault();

            cardId = $(ele).data('id');
            $.ajax({
                method: 'GET',
                url: `/board/card/${boardId}/${cardId}`
            }).then(res => {
                let newElement = $(res);
                $('#cardModal').empty().append(newElement).show();
            }, err => {
                $('html').html($(err.responseText));
            });
        });
    });

    // GO TO BOARD SETTINGS
    let boardSettingsBtn = $('#board-settings-btn');
    boardSettingsBtn.on('click', event => {
        event.preventDefault();

        window.location.href = `/board/settings/${boardSettingsBtn.data('id')}`;
    });

    // DOWNLOAD CALENDAR
    let downloadCalendarBtn = $('#download-calendar-btn');
    downloadCalendarBtn.on('click', event => {
        event.preventDefault();
        window.location.href = `/board/calendar/${downloadCalendarBtn.data('id')}`;
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
                        // it worked, add the list to the html
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
                                .text('edit list')))
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
                                        .attr('class', 'new-card-name-input')))
                                .append($('<button>')
                                    .attr('class', 'add-card-btn')
                                    .attr('type', 'submit')
                                    .text('add card'))));
                        newListHTML.insertBefore($('#new-list'));
                    }, err => {
                        $('html').html($(err.responseText));
                    });
                    $("input:text"). val("")
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

    // ADD NEW CARD
    $('.new-card').each((ind, ele) => {
        $(ele).on('submit', event => {
            event.preventDefault();

            try {
                let formData = $(ele).serializeArray();
                let cardName = formData[formData.findIndex(
                    elem => elem.name === 'cardName')].value;
                console.log(`URL: [${$(ele).attr('action')}]`);
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
                                    .text(resJson.cardName)))
                            .on('click', event => {
                                event.preventDefault();

                                cardId = resJson.cardId;
                                $.ajax({
                                    method: 'GET',
                                    url: `/board/card/${boardId}/${cardId}`
                                }).then(res => {
                                    let newElement = $(res);
                                    $('#cardModal').empty().append(newElement).show();
                                }, err => {
                                    $('html').html($(err.responseText));
                                });
                            });
                            newCardHTML.insertBefore($(ele));
                        }, err => {
                            $('html').html($(err.responseText));

                        }); 
                        $("input:text"). val("")
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
    });

    // EDIT LIST MODAL FUNCTIONALITY
    $('.edit-list-btn').each((ind, ele) => {
        $(ele).on('click', event => {
            event.preventDefault();

            listId = $(ele).data('id');
            $.ajax({
                method: 'GET',
                url: `/board/list/${boardId}/${listId}`
            }).then(res => {
                let newElement = $(res);
                $('#listModal').empty().append(newElement).show();
            }, err => {
                $('html').html($(err.responseText));
            });
        });
    });

})(window.jQuery);