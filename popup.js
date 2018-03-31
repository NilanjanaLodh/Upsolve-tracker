let current_tab = null;
let added_links = [];
let solved_links = [];
let tags = ['DP', 'Greedy', 'SegTree', 'Graph'];
let current_info = null;
let current_tab_status = 'NA';
/**
 * possible statuses 
 * NA : Never added
 * PENDING : Pending, it's been added
 * SOLVED : It's been Solved before
 */


window.onload = function () {
    initialize();
    console.log('popup opened! ');
    console.log(new Date().toLocaleString());

    //add all event listeners
    document.getElementById("add_link").addEventListener("click", add_link_handler);
    document.getElementById("remove_link").addEventListener("click", remove_link_handler);
    document.getElementById("mark_solved").addEventListener("click", mark_solved_handler);
    document.getElementById("show_saved").addEventListener("click", show_saved_handler);
};


// initial setup
function initialize() {
    console.log('Before  : ' + new Date().toLocaleString());
    //setting up the chrome storage, and other variables
    chrome.storage.sync.get(null, function (obj) {
        //query for the already stored data in chrome storage
        console.log(obj);
        var prev_added_links = obj.added_links;
        var prev_solved_links = obj.solved_links;
        var query = { active: true, currentWindow: true };
        chrome.tabs.query(query, function (tabs) {
            //query for the current tab, and set the other variebles accordingly
            current_tab = tabs[0];
            if (!prev_added_links) {
                chrome.storage.sync.set({ 'added_links': [] }, function () {
                    console.log('set up \'added_links\' for the first time!');
                });
            }
            else {
                //previous added_links have to be used
                added_links = prev_added_links;
                if (added_links.indexOf(current_tab.url) != -1)
                    current_tab_status = 'PENDING';
                //we can change this later for better performance
                // we can assign the status separately only
            }
            if (!prev_solved_links) {
                chrome.storage.sync.set({ 'solved_links': [] }, function () {
                    console.log('set up \'solved_links\' for the first time!');
                });
            }
            else {
                //previous solved_links have to be used
                solved_links = prev_solved_links;
                if (current_tab_status == 'NA') {
                    if (solved_links.indexOf(current_tab.url) != -1)
                        current_tab_status = 'SOLVED';
                }
            }
            if (!obj.tags) {
                chrome.storage.sync.set({ 'tags': tags }, function () {
                    console.log('Set up tags for the first time!');
                });
            }
            else {
                tags = obj.tags;
            }
            if (current_tab_status != 'NA') {
                current_info = obj[current_tab.url];
                console.log(current_info);
                update_status();
                display_tags();
            }
        });

    });
}


function add_link_handler() {
    if (current_tab_status == 'PENDING') {
        swal("Problem is already saved!");
    }
    else if (current_tab_status == 'SOLVED')
        swal('You have solved this problem before!');
    else {
        current_tab_status = 'PENDING';
        added_links.push(current_tab.url);
        current_info = {
            'status': 'PENDING',
            'time_added': new Date().toDateString(),
            'tags': []
        };
        console.log(added_links);
        console.log(current_info);

        chrome.storage.sync.set({
            'added_links': added_links,
            [current_tab.url]: current_info
        }, function () {
            update_status();
            display_tags();
            console.log('saved!');
            swal('Problem saved!');
        });
    }
}

function remove_link_handler() {
    if (current_tab_status == 'NA') {
        swal('Problem is not in your todo list!');
    }
    else if (current_tab_status == 'SOLVED')
        swal('You have solved this problem before!');
    else {
        added_links = added_links.filter(link => (link != current_tab.url));
        current_tab_status = 'NA';
        current_info = null;
        console.log(added_links);
        chrome.storage.sync.set({ 'added_links': added_links }, function () {
            console.log('removed!');
        });
        hide_tags();
        update_status();
        chrome.storage.sync.remove(current_tab.url, function () {
            swal('Problem removed!');
        });
    }
}

function mark_solved_handler() {
    if (current_tab_status == 'SOLVED') {
        swal('You have solved this problem before!');
    }
    else {
        if (current_tab_status == 'PENDING') {
            //first remove it from added_links
            added_links = added_links.filter(link => (link != current_tab.url));
            console.log(added_links);
            chrome.storage.sync.set({ 'added_links': added_links }, function () {
                console.log('removed from added_links!');
            });
        }

        if (!current_info)
            current_info = { 'tags': [] };
        if (current_tab_status == 'NA') {
            display_tags();
        }
        current_tab_status = 'SOLVED';
        update_status();
        current_info.status = 'SOLVED';
        current_info.time_solved = new Date().toDateString();
        solved_links.push(current_tab.url);
        console.log(solved_links);
        console.log(current_info);
        chrome.storage.sync.set({
            'solved_links': solved_links,
            [current_tab.url]: current_info
        }, function () {
            console.log('marked as solved!');
            swal('Problem marked as solved!');
        });
    }
}


function show_saved_handler() {
    chrome.storage.sync.get(null,
        function (obj) {
            console.log(obj);
        }
    );
    chrome.tabs.create({ 'url': chrome.extension.getURL('dashboard.html') });
}

function display_tags() {
    let tags_section = document.getElementById('tags-section');
    for (tag of tags) {
        let txt = document.createTextNode(tag);
        let utxt = document.createElement('a');
        utxt.setAttribute('href', '#');
        if (current_info.tags.indexOf(tag) == -1)
            utxt.setAttribute('class', 'tag-off');//this was not selected before
        else
            utxt.setAttribute('class', 'tag-on');//this is already one of the tags
        utxt.appendChild(txt);
        let li = document.createElement('li');
        li.appendChild(utxt);
        tags_section.appendChild(li);
        $(utxt).click(tag_click_handler);
    }
}

function hide_tags() {
    let tags_section = document.getElementById('tags-section');
    while (tags_section.hasChildNodes()) {
        tags_section.removeChild(tags_section.lastChild);
    }
}

function tag_click_handler() {
    console.log('works!');
    if ($(this).attr('class') == 'tag-off') {
        console.log(this);
        if (!current_info.tags)
            current_info.tags = [];
        current_info.tags.push(this.innerText);
        $(this).attr('class', 'tag-on');
    }
    else {
        //"on" tag clicked
        let thistag = this.innerText;
        current_info.tags = current_info.tags.filter(tag => (tag != thistag));
        $(this).attr('class', 'tag-off');
    }
    console.log(current_info);
    chrome.storage.sync.set({ [current_tab.url]: current_info });
}

function update_status() {
    let stat_p = document.getElementById('status');
    if (current_tab_status == 'NA')
        $(stat_p).text('');
    else
        $(stat_p).text(current_tab_status);
        $(stat_p).attr('class',current_tab_status);
}
