/* ============================================================
   PHONEBOOK - GITHUB PAGES VERSION
   No C++ server required.
   Data is stored in browser localStorage.
   Compatible with the current index.html and style.css.
   ============================================================ */

"use strict";

/* ============================================================
   STATE
   ============================================================ */

let contacts = [];
let editingPhone = null;
let deletingPhone = null;
let detailsContact = null;
let currentView = "all";

let searchTimer = null;
let toastTimer = null;


/* ============================================================
   LOCAL STORAGE KEYS
   ============================================================ */

const CONTACTS_KEY = "phonebookContacts";
const PHOTOS_KEY = "phonebookContactPhotos";
const FAVORITES_KEY = "phonebookFavorites";
const THEME_KEY = "phonebookTheme";
const BACKGROUND_KEY = "phonebookBackground";
const SIDEBAR_KEY = "phonebookSidebarCollapsed";


/* ============================================================
   ELEMENTS
   ============================================================ */

const app =
    document.querySelector(".app");

const sidebarToggle =
    document.getElementById("sidebarToggle");

const searchNav =
    document.getElementById("searchNav");

const sortNav =
    document.getElementById("sortNav");

const statsNav =
    document.getElementById("statsNav");

const contactGrid =
    document.getElementById("contactGrid");

const loading =
    document.getElementById("loading");

const emptyState =
    document.getElementById("emptyState");

const totalContacts =
    document.getElementById("totalContacts");

const searchInput =
    document.getElementById("searchInput");

const resultText =
    document.getElementById("resultText");

const modalOverlay =
    document.getElementById("modalOverlay");

const deleteOverlay =
    document.getElementById("deleteOverlay");

const contactForm =
    document.getElementById("contactForm");

const modalTitle =
    document.getElementById("modalTitle");

const nameInput =
    document.getElementById("name");

const phoneInput =
    document.getElementById("phone");

const emailInput =
    document.getElementById("email");

const oldPhoneInput =
    document.getElementById("oldPhone");

const saveButton =
    document.getElementById("saveButton");

const formMessage =
    document.getElementById("formMessage");

const deleteText =
    document.getElementById("deleteText");

const photoInput =
    document.getElementById("photoInput");

const photoPreview =
    document.getElementById("photoPreview");

const themeButton =
    document.getElementById("themeButton");

const backgroundSelect =
    document.getElementById("backgroundSelect");

const favoriteNav =
    document.getElementById("favoriteNav");

const contactsNav =
    document.getElementById("contactsNav");

const favoriteNavCount =
    document.getElementById("favoriteNavCount");

const favoriteContactsCount =
    document.getElementById("favoriteContactsCount");

const detailsOverlay =
    document.getElementById("detailsOverlay");

const closeDetails =
    document.getElementById("closeDetails");

const detailsPhoto =
    document.getElementById("detailsPhoto");

const detailsName =
    document.getElementById("detailsName");

const detailsPhone =
    document.getElementById("detailsPhone");

const detailsEmail =
    document.getElementById("detailsEmail");

const detailsFavorite =
    document.getElementById("detailsFavorite");

const detailsEdit =
    document.getElementById("detailsEdit");

const detailsDelete =
    document.getElementById("detailsDelete");

const confirmDelete =
    document.getElementById("confirmDelete");

const sortButton =
    document.getElementById("sortButton");


/* ============================================================
   FAVORITES
   ============================================================ */

let favoritePhones = new Set(
    loadJSON(
        FAVORITES_KEY,
        []
    )
);


/* ============================================================
   GENERIC STORAGE HELPERS
   ============================================================ */

function loadJSON(key, fallback) {
    try {
        const value =
            localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);
    }
    catch (error) {
        return fallback;
    }
}


function saveContacts() {
    localStorage.setItem(
        CONTACTS_KEY,
        JSON.stringify(contacts)
    );
}


function saveFavorites() {
    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(
            [...favoritePhones]
        )
    );
}


/* ============================================================
   PHONE NORMALIZATION
   ============================================================ */

function normalizePhone(phone) {
    return String(phone || "")
        .replace(/\D/g, "");
}


/* ============================================================
   INITIALS
   ============================================================ */

function getInitials(name) {

    const parts =
        String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 0) {
        return "?";
    }

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


/* ============================================================
   CONTACT PHOTOS
   ============================================================ */

function loadContactPhotos() {

    return loadJSON(
        PHOTOS_KEY,
        {}
    );
}


function saveContactPhotos(photos) {

    localStorage.setItem(
        PHOTOS_KEY,
        JSON.stringify(photos)
    );
}


function getContactPhoto(phone) {

    const photos =
        loadContactPhotos();

    return (
        photos[
            normalizePhone(phone)
        ] || ""
    );
}


function setContactPhoto(
    phone,
    dataURL
) {

    const photos =
        loadContactPhotos();

    const key =
        normalizePhone(phone);

    if (dataURL) {
        photos[key] = dataURL;
    }
    else {
        delete photos[key];
    }

    saveContactPhotos(photos);
}


function moveContactPhoto(
    oldPhone,
    newPhone
) {

    const photos =
        loadContactPhotos();

    const oldKey =
        normalizePhone(oldPhone);

    const newKey =
        normalizePhone(newPhone);

    if (photos[oldKey]) {

        photos[newKey] =
            photos[oldKey];

        delete photos[oldKey];

        saveContactPhotos(photos);
    }
}


function removeContactPhoto(phone) {

    const photos =
        loadContactPhotos();

    delete photos[
        normalizePhone(phone)
    ];

    saveContactPhotos(photos);
}


/* ============================================================
   PHOTO RESIZE
   ============================================================ */

function resizePhoto(file) {

    return new Promise(
        (resolve, reject) => {

            if (!file) {
                resolve("");
                return;
            }

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {
                reject(
                    new Error(
                        "Please select an image file."
                    )
                );

                return;
            }

            const reader =
                new FileReader();

            reader.onload =
                function(event) {

                    const image =
                        new Image();

                    image.onload =
                        function() {

                            const maxSize =
                                300;

                            let width =
                                image.width;

                            let height =
                                image.height;

                            if (
                                width >
                                height &&
                                width >
                                maxSize
                            ) {

                                height =
                                    Math.round(
                                        height *
                                        maxSize /
                                        width
                                    );

                                width =
                                    maxSize;
                            }

                            else if (
                                height >=
                                width &&
                                height >
                                maxSize
                            ) {

                                width =
                                    Math.round(
                                        width *
                                        maxSize /
                                        height
                                    );

                                height =
                                    maxSize;
                            }

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );

                            canvas.width =
                                width;

                            canvas.height =
                                height;

                            const context =
                                canvas.getContext(
                                    "2d"
                                );

                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );

                            resolve(
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.82
                                )
                            );
                        };

                    image.onerror =
                        function() {

                            reject(
                                new Error(
                                    "Could not read the selected image."
                                )
                            );
                        };

                    image.src =
                        event.target.result;
                };

            reader.onerror =
                function() {

                    reject(
                        new Error(
                            "Could not read the selected image."
                        )
                    );
                };

            reader.readAsDataURL(file);
        }
    );
}


/* ============================================================
   PHOTO PREVIEW
   ============================================================ */

function clearPhotoPreview() {

    if (!photoPreview) {
        return;
    }

    photoPreview.innerHTML = "";

    photoPreview.style.display =
        "none";
}


function showPhotoPreview(dataURL) {

    if (!photoPreview) {
        return;
    }

    photoPreview.innerHTML = "";

    if (!dataURL) {

        photoPreview.style.display =
            "none";

        return;
    }

    const image =
        document.createElement("img");

    image.src = dataURL;

    image.alt =
        "Profile photo preview";

    photoPreview.appendChild(
        image
    );

    photoPreview.style.display =
        "block";
}


/* ============================================================
   LOAD CONTACTS
   ============================================================ */

function loadContacts() {

    if (loading) {
        loading.style.display =
            "block";
    }

    contacts =
        loadJSON(
            CONTACTS_KEY,
            []
        );

    if (!Array.isArray(contacts)) {
        contacts = [];
    }

    contacts =
        contacts.filter(
            contact =>
                contact &&
                contact.name &&
                contact.phone
        );

    sortContactsInternal();

    updateFavoriteCount();

    renderCurrentView();

    if (loading) {
        loading.style.display =
            "none";
    }
}


/* ============================================================
   SORT CONTACTS
   ============================================================ */

function sortContactsInternal() {

    contacts.sort(
        (a, b) =>
            String(a.name)
                .localeCompare(
                    String(b.name),
                    undefined,
                    {
                        sensitivity: "base"
                    }
                )
    );
}


function sortContactsAZ(
    showMessage = true
) {

    sortContactsInternal();

    saveContacts();

    renderCurrentView();

    if (showMessage) {

        showToast(
            "Contacts sorted A → Z",
            "✓"
        );
    }
}


/* ============================================================
   BINARY SEARCH
   ============================================================ */

function binarySearchByName(
    target
) {

    const search =
        String(target || "")
            .trim()
            .toLowerCase();

    let left = 0;

    let right =
        contacts.length - 1;

    while (left <= right) {

        const middle =
            Math.floor(
                (left + right) / 2
            );

        const current =
            String(
                contacts[middle].name
            ).toLowerCase();

        if (current === search) {
            return middle;
        }

        if (current < search) {
            left =
                middle + 1;
        }
        else {
            right =
                middle - 1;
        }
    }

    return -1;
}


/* ============================================================
   SEARCH
   ============================================================ */

function performSearch() {

    const query =
        searchInput
            ? searchInput.value.trim()
            : "";

    if (!query) {

        renderCurrentView();

        return;
    }

    const lowerQuery =
        query.toLowerCase();

    const normalizedQuery =
        normalizePhone(query);

    const results = [];

    /*
       EXACT NAME SEARCH
       Uses binary search because
       contacts are sorted by name.
    */

    const exactIndex =
        binarySearchByName(
            query
        );

    if (exactIndex !== -1) {

        results.push(
            contacts[exactIndex]
        );
    }

    /*
       PHONE SEARCH + PARTIAL SEARCH
    */

    contacts.forEach(
        contact => {

            const name =
                String(
                    contact.name || ""
                ).toLowerCase();

            const phone =
                String(
                    contact.phone || ""
                );

            const email =
                String(
                    contact.email || ""
                ).toLowerCase();

            const nameMatch =
                name.includes(
                    lowerQuery
                );

            const phoneMatch =
                normalizedQuery &&
                normalizePhone(
                    phone
                ).includes(
                    normalizedQuery
                );

            const emailMatch =
                email.includes(
                    lowerQuery
                );

            if (
                nameMatch ||
                phoneMatch ||
                emailMatch
            ) {

                const exists =
                    results.some(
                        item =>
                            normalizePhone(
                                item.phone
                            ) ===
                            normalizePhone(
                                contact.phone
                            )
                    );

                if (!exists) {
                    results.push(
                        contact
                    );
                }
            }
        }
    );

    results.sort(
        (a, b) =>
            String(a.name)
                .localeCompare(
                    String(b.name),
                    undefined,
                    {
                        sensitivity: "base"
                    }
                )
    );

    renderContacts(
        results,
        true
    );
}


/* ============================================================
   RENDER CONTACTS
   ============================================================ */

function renderContacts(
    list,
    isSearchResult = false
) {

    if (!contactGrid) {
        return;
    }

    contactGrid.innerHTML = "";

    if (totalContacts) {

        totalContacts.textContent =
            contacts.length;
    }

    if (
        !list ||
        list.length === 0
    ) {

        if (emptyState) {
            emptyState.style.display =
                "block";
        }

        if (resultText) {

            if (isSearchResult) {
                resultText.textContent =
                    "No contacts found.";
            }
            else if (
                currentView ===
                "favorites"
            ) {
                resultText.textContent =
                    "No favorite contacts.";
            }
            else {
                resultText.textContent =
                    "No contacts found.";
            }
        }

        return;
    }

    if (emptyState) {
        emptyState.style.display =
            "none";
    }

    if (resultText) {

        if (isSearchResult) {

            resultText.textContent =
                `${list.length} search result${
                    list.length === 1
                        ? ""
                        : "s"
                }`;
        }

        else if (
            currentView ===
            "favorites"
        ) {

            resultText.textContent =
                `${list.length} favorite contact${
                    list.length === 1
                        ? ""
                        : "s"
                }`;
        }

        else {

            resultText.textContent =
                "Your saved contacts";
        }
    }

    list.forEach(
        contact => {

            contactGrid.appendChild(
                createContactCard(
                    contact
                )
            );
        }
    );
}


function renderCurrentView() {

    const query =
        searchInput
            ? searchInput.value.trim()
            : "";

    /*
       If searching, use local search.
    */

    if (query) {

        performSearch();

        return;
    }

    if (
        currentView ===
        "favorites"
    ) {

        const favorites =
            contacts.filter(
                contact =>
                    isFavorite(
                        contact.phone
                    )
            );

        renderContacts(
            favorites
        );

        return;
    }

    renderContacts(
        contacts
    );
}


/* ============================================================
   CREATE CONTACT CARD
   ============================================================ */

function createContactCard(
    contact
) {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "contact-card";

    card.style.cursor =
        "pointer";

    if (
        isFavorite(
            contact.phone
        )
    ) {

        card.classList.add(
            "is-favorite"
        );
    }

    card.addEventListener(
        "click",
        function(event) {

            if (
                event.target.closest(
                    "button"
                )
            ) {
                return;
            }

            openDetailsModal(
                contact
            );
        }
    );


    /* AVATAR */

    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "avatar";

    const photo =
        getContactPhoto(
            contact.phone
        );

    if (photo) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            photo;

        image.alt =
            `${contact.name} profile photo`;

        image.className =
            "avatar-photo";

        avatar.appendChild(
            image
        );
    }

    else {

        avatar.textContent =
            getInitials(
                contact.name
            );
    }


    /* INFORMATION */

    const info =
        document.createElement(
            "div"
        );

    info.className =
        "contact-info";

    const name =
        document.createElement(
            "div"
        );

    name.className =
        "contact-name";

    name.textContent =
        contact.name;

    const phone =
        document.createElement(
            "div"
        );

    phone.className =
        "contact-detail";

    phone.textContent =
        "☎ " +
        contact.phone;

    const email =
        document.createElement(
            "div"
        );

    email.className =
        "contact-detail";

    email.textContent =
        "✉ " +
        (
            contact.email ||
            "N/A"
        );

    info.appendChild(
        name
    );

    info.appendChild(
        phone
    );

    info.appendChild(
        email
    );


    /* ACTIONS */

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "contact-actions";


    /* FAVORITE BUTTON */

    const favoriteButton =
        document.createElement(
            "button"
        );

    favoriteButton.className =
        "icon-button favorite-button";

    favoriteButton.type =
        "button";

    favoriteButton.textContent =
        isFavorite(
            contact.phone
        )
            ? "★"
            : "☆";

    favoriteButton.title =
        isFavorite(
            contact.phone
        )
            ? "Remove from favorites"
            : "Add to favorites";

    favoriteButton.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            toggleFavorite(
                contact.phone
            );
        }
    );


    /* EDIT BUTTON */

    const editButton =
        document.createElement(
            "button"
        );

    editButton.className =
        "icon-button";

    editButton.type =
        "button";

    editButton.textContent =
        "✎";

    editButton.title =
        "Edit contact";

    editButton.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            openEditModal(
                contact
            );
        }
    );


    /* DELETE BUTTON */

    const deleteButton =
        document.createElement(
            "button"
        );

    deleteButton.className =
        "icon-button delete";

    deleteButton.type =
        "button";

    deleteButton.textContent =
        "×";

    deleteButton.title =
        "Delete contact";

    deleteButton.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            openDeleteModal(
                contact
            );
        }
    );


    actions.appendChild(
        favoriteButton
    );

    actions.appendChild(
        editButton
    );

    actions.appendChild(
        deleteButton
    );


    card.appendChild(
        avatar
    );

    card.appendChild(
        info
    );

    card.appendChild(
        actions
    );

    return card;
}


/* ============================================================
   FAVORITES
   ============================================================ */

function isFavorite(phone) {

    return favoritePhones.has(
        normalizePhone(phone)
    );
}


function updateFavoriteCount() {

    const count =
        contacts.filter(
            contact =>
                isFavorite(
                    contact.phone
                )
        ).length;

    if (favoriteContactsCount) {

        favoriteContactsCount.textContent =
            count;
    }

    if (favoriteNavCount) {

        favoriteNavCount.textContent =
            count;
    }
}


function moveFavorite(
    oldPhone,
    newPhone
) {

    const oldKey =
        normalizePhone(oldPhone);

    const newKey =
        normalizePhone(newPhone);

    if (
        oldKey ===
        newKey
    ) {
        return;
    }

    if (
        favoritePhones.has(
            oldKey
        )
    ) {

        favoritePhones.delete(
            oldKey
        );

        favoritePhones.add(
            newKey
        );

        saveFavorites();
    }
}


function toggleFavorite(phone) {

    const key =
        normalizePhone(phone);

    if (
        favoritePhones.has(
            key
        )
    ) {

        favoritePhones.delete(
            key
        );

        showToast(
            "Removed from favorites.",
            "☆"
        );
    }

    else {

        favoritePhones.add(
            key
        );

        showToast(
            "Added to favorites.",
            "★"
        );
    }

    saveFavorites();

    updateFavoriteCount();

    renderCurrentView();
}


/* ============================================================
   ADD MODAL
   ============================================================ */

function openAddModal() {

    editingPhone = null;

    if (modalTitle) {
        modalTitle.textContent =
            "Add Contact";
    }

    if (contactForm) {
        contactForm.reset();
    }

    if (photoInput) {
        photoInput.value = "";
    }

    clearPhotoPreview();

    if (oldPhoneInput) {
        oldPhoneInput.value = "";
    }

    clearFormMessage();

    if (saveButton) {
        saveButton.textContent =
            "Save Contact";
    }

    if (modalOverlay) {
        modalOverlay.classList.add(
            "show"
        );
    }

    setTimeout(
        function() {

            if (nameInput) {
                nameInput.focus();
            }

        },
        100
    );
}


/* ============================================================
   EDIT MODAL
   ============================================================ */

function openEditModal(
    contact
) {

    editingPhone =
        contact.phone;

    if (modalTitle) {
        modalTitle.textContent =
            "Edit Contact";
    }

    if (nameInput) {
        nameInput.value =
            contact.name;
    }

    if (phoneInput) {
        phoneInput.value =
            contact.phone;
    }

    if (emailInput) {

        emailInput.value =
            contact.email === "N/A"
                ? ""
                : (
                    contact.email ||
                    ""
                );
    }

    if (oldPhoneInput) {

        oldPhoneInput.value =
            contact.phone;
    }

    if (photoInput) {
        photoInput.value = "";
    }

    showPhotoPreview(
        getContactPhoto(
            contact.phone
        )
    );

    clearFormMessage();

    if (saveButton) {
        saveButton.textContent =
            "Update Contact";
    }

    if (modalOverlay) {

        modalOverlay.classList.add(
            "show"
        );
    }

    setTimeout(
        function() {

            if (nameInput) {
                nameInput.focus();
            }

        },
        100
    );
}


/* ============================================================
   CLOSE ADD/EDIT MODAL
   ============================================================ */

function closeModal() {

    if (modalOverlay) {

        modalOverlay.classList.remove(
            "show"
        );
    }

    editingPhone = null;
}


/* ============================================================
   FORM MESSAGE
   ============================================================ */

function clearFormMessage() {

    if (!formMessage) {
        return;
    }

    formMessage.textContent = "";

    formMessage.className =
        "form-message";
}


function showFormError(
    message
) {

    if (!formMessage) {
        return;
    }

    formMessage.textContent =
        message;

    formMessage.className =
        "form-message error";
}


/* ============================================================
   DUPLICATE PHONE CHECK
   ============================================================ */

function getDuplicateContact(
    phone,
    excludePhone = null
) {

    const target =
        normalizePhone(phone);

    const excluded =
        normalizePhone(
            excludePhone
        );

    return contacts.find(
        contact => {

            const value =
                normalizePhone(
                    contact.phone
                );

            return (
                value === target &&
                value !== excluded
            );
        }
    );
}


/* ============================================================
   SAVE / UPDATE CONTACT
   ============================================================ */

if (contactForm) {

    contactForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const name =
                nameInput
                    ? nameInput.value.trim()
                    : "";

            const phone =
                phoneInput
                    ? phoneInput.value.trim()
                    : "";

            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const photoFile =
                photoInput &&
                photoInput.files
                    ? photoInput.files[0]
                    : null;


            if (!name) {

                showFormError(
                    "Please enter a name."
                );

                return;
            }


            if (!phone) {

                showFormError(
                    "Please enter a phone number."
                );

                return;
            }


            const duplicate =
                getDuplicateContact(
                    phone,
                    editingPhone
                );

            if (duplicate) {

                showFormError(
                    `A contact with phone number ${duplicate.phone} already exists.`
                );

                showToast(
                    "Duplicate phone number.",
                    "!"
                );

                return;
            }


            try {

                let photoData = "";

                if (photoFile) {

                    photoData =
                        await resizePhoto(
                            photoFile
                        );
                }


                /*
                   UPDATE EXISTING CONTACT
                */

                if (editingPhone) {

                    const index =
                        contacts.findIndex(
                            contact =>
                                normalizePhone(
                                    contact.phone
                                ) ===
                                normalizePhone(
                                    editingPhone
                                )
                        );

                    if (index === -1) {

                        showFormError(
                            "Contact not found."
                        );

                        return;
                    }


                    const oldPhone =
                        contacts[index].phone;


                    contacts[index] = {

                        name: name,

                        phone: phone,

                        email:
                            email ||
                            "N/A"
                    };


                    /*
                       Move photo if phone changed.
                    */

                    if (
                        normalizePhone(
                            oldPhone
                        ) !==
                        normalizePhone(
                            phone
                        )
                    ) {

                        moveContactPhoto(
                            oldPhone,
                            phone
                        );

                        moveFavorite(
                            oldPhone,
                            phone
                        );
                    }


                    /*
                       Replace photo if a
                       new one was selected.
                    */

                    if (photoData) {

                        setContactPhoto(
                            phone,
                            photoData
                        );
                    }


                    sortContactsInternal();

                    saveContacts();

                    closeModal();

                    updateFavoriteCount();

                    renderCurrentView();

                    showToast(
                        "Contact updated successfully.",
                        "✓"
                    );

                    return;
                }


                /*
                   ADD NEW CONTACT
                */

                contacts.push({

                    name: name,

                    phone: phone,

                    email:
                        email ||
                        "N/A"
                });


                if (photoData) {

                    setContactPhoto(
                        phone,
                        photoData
                    );
                }


                sortContactsInternal();

                saveContacts();

                closeModal();

                updateFavoriteCount();

                renderCurrentView();

                showToast(
                    "Contact added successfully.",
                    "✓"
                );
            }

            catch (error) {

                showFormError(
                    error.message ||
                    "Could not save contact."
                );
            }

        }
    );
}


/* ============================================================
   PHOTO INPUT
   ============================================================ */

if (photoInput) {

    photoInput.addEventListener(
        "change",
        async function() {

            const file =
                photoInput.files[0];

            if (!file) {

                clearPhotoPreview();

                return;
            }

            try {

                const preview =
                    await resizePhoto(
                        file
                    );

                showPhotoPreview(
                    preview
                );
            }

            catch (error) {

                photoInput.value =
                    "";

                clearPhotoPreview();

                showFormError(
                    error.message
                );
            }
        }
    );
}


/* ============================================================
   DELETE MODAL
   ============================================================ */

function openDeleteModal(
    contact
) {

    deletingPhone =
        contact.phone;

    if (deleteText) {

        deleteText.textContent =
            `Are you sure you want to delete ${contact.name}?`;
    }

    if (deleteOverlay) {

        deleteOverlay.classList.add(
            "show"
        );
    }
}


function closeDeleteModal() {

    if (deleteOverlay) {

        deleteOverlay.classList.remove(
            "show"
        );
    }

    deletingPhone = null;
}


/* ============================================================
   DELETE CONTACT
   ============================================================ */

if (confirmDelete) {

    confirmDelete.addEventListener(
        "click",
        function() {

            if (!deletingPhone) {
                return;
            }

            const phoneToDelete =
                deletingPhone;


            const index =
                contacts.findIndex(
                    contact =>
                        normalizePhone(
                            contact.phone
                        ) ===
                        normalizePhone(
                            phoneToDelete
                        )
                );


            if (index === -1) {

                closeDeleteModal();

                showToast(
                    "Contact not found.",
                    "!"
                );

                return;
            }


            contacts.splice(
                index,
                1
            );


            removeContactPhoto(
                phoneToDelete
            );


            favoritePhones.delete(
                normalizePhone(
                    phoneToDelete
                )
            );


            saveContacts();

            saveFavorites();

            updateFavoriteCount();

            closeDeleteModal();

            renderCurrentView();

            showToast(
                "Contact deleted successfully.",
                "✓"
            );
        }
    );
}


/* ============================================================
   CONTACT DETAILS
   ============================================================ */

function openDetailsModal(
    contact
) {

    if (!detailsOverlay) {
        return;
    }

    detailsContact =
        contact;


    if (detailsName) {

        detailsName.textContent =
            contact.name;
    }


    if (detailsPhone) {

        detailsPhone.textContent =
            contact.phone;
    }


    if (detailsEmail) {

        detailsEmail.textContent =
            contact.email ||
            "N/A";
    }


    if (detailsFavorite) {

        detailsFavorite.textContent =
            isFavorite(
                contact.phone
            )
                ? "Favorite"
                : "Not Favorite";
    }


    if (detailsPhoto) {

        detailsPhoto.innerHTML = "";

        const photo =
            getContactPhoto(
                contact.phone
            );

        if (photo) {

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                photo;

            image.alt =
                `${contact.name} profile photo`;

            image.style.width =
                "100%";

            image.style.height =
                "100%";

            image.style.objectFit =
                "cover";

            image.style.borderRadius =
                "inherit";

            detailsPhoto.appendChild(
                image
            );
        }

        else {

            detailsPhoto.textContent =
                getInitials(
                    contact.name
                );
        }
    }


    detailsOverlay.classList.add(
        "show"
    );
}


function closeDetailsModal() {

    if (detailsOverlay) {

        detailsOverlay.classList.remove(
            "show"
        );
    }

    detailsContact = null;
}


/* ============================================================
   DETAILS EDIT
   ============================================================ */

if (detailsEdit) {

    detailsEdit.addEventListener(
        "click",
        function() {

            if (!detailsContact) {
                return;
            }

            const contact =
                detailsContact;

            closeDetailsModal();

            openEditModal(
                contact
            );
        }
    );
}


/* ============================================================
   DETAILS DELETE
   ============================================================ */

if (detailsDelete) {

    detailsDelete.addEventListener(
        "click",
        function() {

            if (!detailsContact) {
                return;
            }

            const contact =
                detailsContact;

            closeDetailsModal();

            openDeleteModal(
                contact
            );
        }
    );
}


/* ============================================================
   CLOSE DETAILS
   ============================================================ */

if (closeDetails) {

    closeDetails.addEventListener(
        "click",
        closeDetailsModal
    );
}


/* ============================================================
   SEARCH INPUT
   ============================================================ */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function() {

            clearTimeout(
                searchTimer
            );


            currentView =
                "all";


            if (favoriteNav) {

                favoriteNav.classList.remove(
                    "active"
                );
            }


            if (contactsNav) {

                contactsNav.classList.add(
                    "active"
                );
            }


            searchTimer =
                setTimeout(
                    performSearch,
                    150
                );
        }
    );
}


/* ============================================================
   ADD BUTTONS
   ============================================================ */

document.getElementById(
    "addButton"
)?.addEventListener(
    "click",
    openAddModal
);


document.getElementById(
    "addNav"
)?.addEventListener(
    "click",
    openAddModal
);


document.getElementById(
    "emptyAddButton"
)?.addEventListener(
    "click",
    openAddModal
);


/* ============================================================
   CLOSE BUTTONS
   ============================================================ */

document.getElementById(
    "closeModal"
)?.addEventListener(
    "click",
    closeModal
);


document.getElementById(
    "cancelButton"
)?.addEventListener(
    "click",
    closeModal
);


document.getElementById(
    "cancelDelete"
)?.addEventListener(
    "click",
    closeDeleteModal
);


/* ============================================================
   FAVORITES NAVIGATION
   ============================================================ */

if (favoriteNav) {

    favoriteNav.addEventListener(
        "click",
        function() {

            currentView =
                "favorites";


            if (searchInput) {

                searchInput.value =
                    "";
            }


            favoriteNav.classList.add(
                "active"
            );


            if (contactsNav) {

                contactsNav.classList.remove(
                    "active"
                );
            }


            renderCurrentView();
        }
    );
}


/* ============================================================
   CONTACTS NAVIGATION
   ============================================================ */

if (contactsNav) {

    contactsNav.addEventListener(
        "click",
        function() {

            currentView =
                "all";


            if (searchInput) {

                searchInput.value =
                    "";
            }


            if (favoriteNav) {

                favoriteNav.classList.remove(
                    "active"
                );
            }


            contactsNav.classList.add(
                "active"
            );


            renderCurrentView();
        }
    );
}


/* ============================================================
   FAVORITES STAT CARD
   ============================================================ */

if (favoriteContactsCount) {

    const favoriteCard =
        favoriteContactsCount.closest(
            ".stat-card"
        );

    if (favoriteCard) {

        favoriteCard.style.cursor =
            "pointer";

        favoriteCard.addEventListener(
            "click",
            function() {

                if (favoriteNav) {
                    favoriteNav.click();
                }
            }
        );
    }
}


/* ============================================================
   TOTAL CONTACTS STAT CARD
   ============================================================ */

if (totalContacts) {

    const totalCard =
        totalContacts.closest(
            ".stat-card"
        );

    if (totalCard) {

        totalCard.style.cursor =
            "pointer";

        totalCard.addEventListener(
            "click",
            function() {

                if (contactsNav) {
                    contactsNav.click();
                }
            }
        );
    }
}


/* ============================================================
   SORT BUTTON
   ============================================================ */

if (sortButton) {

    sortButton.addEventListener(
        "click",
        function() {

            sortContactsAZ();
        }
    );
}


/* ============================================================
   SIDEBAR
   ============================================================ */

function setHamburgerIcon() {

    if (!sidebarToggle) {
        return;
    }

    sidebarToggle.innerHTML =
        "☰";

    sidebarToggle.setAttribute(
        "aria-label",
        "Toggle sidebar"
    );
}


function setSidebarCollapsed(
    collapsed
) {

    if (!app) {
        return;
    }


    app.classList.toggle(
        "sidebar-collapsed",
        collapsed
    );


    document.body.classList.toggle(
        "sidebar-collapsed",
        collapsed
    );


    setHamburgerIcon();


    if (sidebarToggle) {

        sidebarToggle.setAttribute(
            "aria-expanded",
            collapsed
                ? "false"
                : "true"
        );

        sidebarToggle.setAttribute(
            "title",
            collapsed
                ? "Open sidebar"
                : "Close sidebar"
        );
    }


    localStorage.setItem(
        SIDEBAR_KEY,
        collapsed
            ? "1"
            : "0"
    );
}


function toggleSidebar() {

    if (!app) {
        return;
    }

    const collapsed =
        app.classList.contains(
            "sidebar-collapsed"
        );

    setSidebarCollapsed(
        !collapsed
    );
}


if (sidebarToggle) {

    setHamburgerIcon();

    sidebarToggle.addEventListener(
        "click",
        toggleSidebar
    );
}


/* ============================================================
   SEARCH SIDEBAR BUTTON
   ============================================================ */

if (searchNav) {

    searchNav.addEventListener(
        "click",
        function() {

            if (searchInput) {

                searchInput.focus();

                searchInput.select();
            }
        }
    );
}


/* ============================================================
   SORT SIDEBAR BUTTON
   ============================================================ */

if (sortNav) {

    sortNav.addEventListener(
        "click",
        function() {

            sortContactsAZ();
        }
    );
}


/* ============================================================
   STATISTICS SIDEBAR BUTTON
   ============================================================ */

if (statsNav) {

    statsNav.addEventListener(
        "click",
        function() {

            const stats =
                document.querySelector(
                    ".stats"
                );

            if (stats) {

                stats.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }
    );
}


/* ============================================================
   DARK MODE
   ============================================================ */

function updateThemeButton() {

    if (!themeButton) {
        return;
    }

    const dark =
        document.body.dataset.theme ===
        "dark";

    themeButton.textContent =
        dark
            ? "☀ Light"
            : "☾ Dark";

    themeButton.title =
        dark
            ? "Switch to light mode"
            : "Switch to dark mode";
}


function toggleTheme() {

    const next =
        document.body.dataset.theme ===
        "dark"
            ? "light"
            : "dark";

    document.body.dataset.theme =
        next;

    localStorage.setItem(
        THEME_KEY,
        next
    );

    updateThemeButton();
}


if (themeButton) {

    themeButton.addEventListener(
        "click",
        toggleTheme
    );
}


/* ============================================================
   BACKGROUND
   ============================================================ */

function changeBackground(
    value
) {

    document.body.dataset.background =
        value;

    localStorage.setItem(
        BACKGROUND_KEY,
        value
    );
}


if (backgroundSelect) {

    backgroundSelect.addEventListener(
        "change",
        function(event) {

            changeBackground(
                event.target.value
            );
        }
    );
}


/* ============================================================
   APPLY SAVED SETTINGS
   ============================================================ */

function applySavedSettings() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        ) || "light";

    const background =
        localStorage.getItem(
            BACKGROUND_KEY
        ) || "default";

    document.body.dataset.theme =
        theme;

    document.body.dataset.background =
        background;


    if (backgroundSelect) {

        backgroundSelect.value =
            background;
    }


    updateThemeButton();


    const collapsed =
        localStorage.getItem(
            SIDEBAR_KEY
        ) === "1";

    setSidebarCollapsed(
        collapsed
    );
}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(
    message,
    icon = "✓"
) {

    const toast =
        document.getElementById(
            "toast"
        );

    const toastIcon =
        document.getElementById(
            "toastIcon"
        );

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );


    if (!toast) {
        return;
    }


    if (toastIcon) {

        toastIcon.textContent =
            icon;
    }


    if (toastMessage) {

        toastMessage.textContent =
            message;
    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );
}


/* ============================================================
   MODAL BACKDROP CLICK
   ============================================================ */

if (modalOverlay) {

    modalOverlay.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                modalOverlay
            ) {

                closeModal();
            }
        }
    );
}


if (deleteOverlay) {

    deleteOverlay.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                deleteOverlay
            ) {

                closeDeleteModal();
            }
        }
    );
}


if (detailsOverlay) {

    detailsOverlay.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                detailsOverlay
            ) {

                closeDetailsModal();
            }
        }
    );
}


/* ============================================================
   ESC KEY
   ============================================================ */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key !==
            "Escape"
        ) {
            return;
        }

        closeModal();

        closeDeleteModal();

        closeDetailsModal();
    }
);


/* ============================================================
   START APPLICATION
   ============================================================ */

applySavedSettings();

loadContacts();

updateFavoriteCount();

setHamburgerIcon();
