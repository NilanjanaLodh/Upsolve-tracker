let current_tab = null;
let added_links = [];
let solved_links = [];
let tags = ['DP', 'Greedy', 'AdHoc', 'Graph'];
let current_info = null;
let current_tab_status = 'NA';

let tag_input_el = null;
let tag_list_el = null;
let tags_section = null;
let onscreen_tags = new Set();
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
    tag_input_el = document.getElementById("tag_input");
    tag_input_el.addEventListener("keyup", add_tag, false);
    tag_list_el = document.getElementById("tag_list");
    tags_section = document.getElementById("tags-section");

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

            update_status();
            populate_tag_list();
            if (current_tab_status != 'NA') {
                current_info = obj[current_tab.url];
                console.log(current_info);
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

        chrome.storage.sync.set({
            'added_links': added_links,
            [current_tab.url]: current_info
        }, function () {
            update_status();
            display_tags();
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
        chrome.storage.sync.set({ 'added_links': added_links });
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
        chrome.storage.sync.set({
            'solved_links': solved_links,
            [current_tab.url]: current_info
        }, function () {
            swal('Problem marked as solved!');
        });
    }
}


function show_saved_handler() {
    chrome.tabs.create({ 'url': chrome.extension.getURL('dashboard.html') });
}

function create_tag_element(tagname, on = false) {
    let txt = document.createTextNode(tagname);
    let utxt = document.createElement('a');
    utxt.setAttribute('href', '#');
    if (on)
        utxt.setAttribute('class', 'tag-on');//this was not selected before
    else
        utxt.setAttribute('class', 'tag-off');//this is already one of the tags
    utxt.appendChild(txt);
    let li = document.createElement('li');
    li.appendChild(utxt);
    tags_section.appendChild(li);
    $(utxt).click(tag_click_handler);
    onscreen_tags.add(tag);
}

function display_tags() {
    let tagdiv = document.getElementById('tagdiv');
    tagdiv.style.display = 'block';

    for (tag of current_info.tags) {
        create_tag_element(tag, true);
    }
}

function hide_tags() {
    let tagdiv = document.getElementById('tagdiv');
    tagdiv.style.display = 'none';
    let tags_section = document.getElementById('tags-section');
    while (tags_section.hasChildNodes()) {
        tags_section.removeChild(tags_section.lastChild);
    }
    onscreen_tags.clear();
}

function tag_click_handler() {
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
        $(stat_p).text('NOT IN TO-DO LIST');
    else
        $(stat_p).text(current_tab_status);

    $(stat_p).attr('class', current_tab_status);
    chrome.browserAction.setBadgeText({ text: added_links.length.toString() });
}

function add_tag(event) {
    if (event.keyCode == 13) {
        event.preventDefault();

        if (tag_input_el.value.length != 0) {
            let newtag = tag_input_el.value;
            
            if ((tags.indexOf(newtag)) == -1) {
                tags.push(newtag);
                console.log(tags);
                chrome.storage.sync.set({ 'tags': tags });
            }
            if (!onscreen_tags.has(newtag)) {
                create_tag_element(newtag, true);
                onscreen_tags.add(newtag);
                //make a red one appear
            }
            current_info.tags.push(newtag);
            chrome.storage.sync.set({ [current_tab.url]: current_info });
            //update the current info of this url

            //swal(tag_input_el.value);
            // Run my specific process with my_field.value 
            //my_field.value = '';
        }
    }
}

function populate_tag_list() {
    for (tag of tags) {
        let opt = document.createElement('option');
        opt.setAttribute('value', tag);
        tag_list_el.appendChild(opt);
    }
}