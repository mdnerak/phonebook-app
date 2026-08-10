/* ============================================================
   PHONEBOOK FRONTEND
   ============================================================ */

let contacts = [];
let editingPhone = null;
let deletingPhone = null;
let detailsContact = null;

let searchTimer = null;
let toastTimer = null;


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
    document.getElementById(
        "favoriteContactsCount"
    );


/* ============================================================
   DETAILS POPUP
   ============================================================ */

const detailsOverlay =
    document.getElementById(
        "detailsOverlay"
    );

const closeDetails =
    document.getElementById(
        "closeDetails"
    );

const detailsPhoto =
    document.getElementById(
        "detailsPhoto"
    );

const detailsName =
    document.getElementById(
        "detailsName"
    );

const detailsPhone =
    document.getElementById(
        "detailsPhone"
    );

const detailsEmail =
    document.getElementById(
        "detailsEmail"
    );

const detailsFavorite =
    document.getElementById(
        "detailsFavorite"
    );

const detailsEdit =
    document.getElementById(
        "detailsEdit"
    );

const detailsDelete =
    document.getElementById(
        "detailsDelete"
    );


/* ============================================================
   LOCAL STORAGE
   ============================================================ */

const PHOTOS_KEY =
    "phonebookContactPhotos";

const FAVORITES_KEY =
    "phonebookFavorites";

const THEME_KEY =
    "phonebookTheme";

const BACKGROUND_KEY =
    "phonebookBackground";

const SIDEBAR_KEY =
    "phonebookSidebarCollapsed";


let favoritePhones =
    new Set(
        JSON.parse(
            localStorage.getItem(
                FAVORITES_KEY
            ) || "[]"
        )
    );


let currentView = "all";


/* ============================================================
   UTILITY
   ============================================================ */

function normalizePhone(phone)
{
    return String(phone || "")
        .replace(/\D/g, "");
}


function getInitials(name)
{
    const parts =
        String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 0)
        return "?";


    if (parts.length === 1)
    {
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

function loadContactPhotos()
{
    try
    {
        return JSON.parse(
            localStorage.getItem(
                PHOTOS_KEY
            ) || "{}"
        );
    }
    catch
    {
        return {};
    }
}


function saveContactPhotos(photos)
{
    localStorage.setItem(
        PHOTOS_KEY,
        JSON.stringify(photos)
    );
}


function getContactPhoto(phone)
{
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
    dataUrl
)
{
    const photos =
        loadContactPhotos();

    const key =
        normalizePhone(phone);


    if (dataUrl)
    {
        photos[key] =
            dataUrl;
    }
    else
    {
        delete photos[key];
    }


    saveContactPhotos(photos);
}


function moveContactPhoto(
    oldPhone,
    newPhone
)
{
    const photos =
        loadContactPhotos();

    const oldKey =
        normalizePhone(oldPhone);

    const newKey =
        normalizePhone(newPhone);


    if (photos[oldKey])
    {
        photos[newKey] =
            photos[oldKey];

        delete photos[oldKey];

        saveContactPhotos(
            photos
        );
    }
}


function removeContactPhoto(phone)
{
    const photos =
        loadContactPhotos();

    delete photos[
        normalizePhone(phone)
    ];

    saveContactPhotos(
        photos
    );
}


/* ============================================================
   RESIZE PHOTO
   ============================================================ */

function resizePhoto(file)
{
    return new Promise(
        (resolve, reject) =>
        {
            if (!file)
            {
                resolve("");
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            )
            {
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
                function(event)
                {
                    const image =
                        new Image();


                    image.onload =
                        function()
                        {
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
                            )
                            {
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
                            )
                            {
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
                        function()
                        {
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
                function()
                {
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

function clearPhotoPreview()
{
    if (!photoPreview)
        return;


    photoPreview.innerHTML =
        "";

    photoPreview.style.display =
        "none";
}


function showPhotoPreview(src)
{
    if (!photoPreview)
        return;


    photoPreview.innerHTML =
        "";


    if (!src)
    {
        photoPreview.style.display =
            "none";

        return;
    }


    const image =
        document.createElement(
            "img"
        );


    image.src =
        src;

    image.alt =
        "Profile photo";


    photoPreview.appendChild(
        image
    );


    photoPreview.style.display =
        "block";
}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(
    message,
    icon = "✓"
)
{
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


    if (
        !toast ||
        !toastMessage
    )
    {
        return;
    }


    if (toastIcon)
    {
        toastIcon.textContent =
            icon;
    }


    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function()
            {
                toast.classList.remove(
                    "show"
                );
            },
            3000
        );
}


/* ============================================================
   FORM ERROR
   ============================================================ */

function showFormError(message)
{
    if (!formMessage)
        return;


    formMessage.textContent =
        message;

    formMessage.className =
        "form-message error";
}


/* ============================================================
   FAVORITES
   ============================================================ */

function saveFavorites()
{
    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(
            [...favoritePhones]
        )
    );
}


function isFavorite(phone)
{
    return favoritePhones.has(
        normalizePhone(phone)
    );
}


function updateFavoriteCount()
{
    const count =
        contacts.filter(
            contact =>
                isFavorite(
                    contact.phone
                )
        ).length;


    if (favoriteContactsCount)
    {
        favoriteContactsCount.textContent =
            count;
    }


    if (favoriteNavCount)
    {
        favoriteNavCount.textContent =
            count;
    }
}


function moveFavorite(
    oldPhone,
    newPhone
)
{
    const oldKey =
        normalizePhone(
            oldPhone
        );

    const newKey =
        normalizePhone(
            newPhone
        );


    if (oldKey === newKey)
        return;


    if (
        favoritePhones.has(
            oldKey
        )
    )
    {
        favoritePhones.delete(
            oldKey
        );

        favoritePhones.add(
            newKey
        );

        saveFavorites();
    }
}


function toggleFavorite(phone)
{
    const key =
        normalizePhone(phone);


    if (
        favoritePhones.has(
            key
        )
    )
    {
        favoritePhones.delete(
            key
        );

        showToast(
            "Removed from favorites.",
            "☆"
        );
    }
    else
    {
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
   LOAD CONTACTS
   ============================================================ */

async function loadContacts()
{
    try
    {
        if (loading)
        {
            loading.style.display =
                "block";
        }


        if (contactGrid)
        {
            contactGrid.innerHTML =
                "";
        }


        const response =
            await fetch(
                "/api/contacts"
            );


        if (!response.ok)
        {
            throw new Error(
                "Could not load contacts."
            );
        }


        contacts =
            await response.json();


        updateFavoriteCount();

        renderCurrentView();
    }
    catch (error)
    {
        showToast(
            error.message,
            "!"
        );
    }
    finally
    {
        if (loading)
        {
            loading.style.display =
                "none";
        }
    }
}


/* ============================================================
   RENDER CONTACTS
   ============================================================ */

function renderContacts(list)
{
    if (!contactGrid)
        return;


    contactGrid.innerHTML =
        "";


    if (totalContacts)
    {
        totalContacts.textContent =
            contacts.length;
    }


    if (
        !list ||
        list.length === 0
    )
    {
        if (emptyState)
        {
            emptyState.style.display =
                "block";
        }


        if (resultText)
        {
            resultText.textContent =
                "No contacts found.";
        }


        return;
    }


    if (emptyState)
    {
        emptyState.style.display =
            "none";
    }


    if (resultText)
    {
        if (
            list.length ===
            contacts.length
        )
        {
            resultText.textContent =
                "Your saved contacts";
        }
        else
        {
            resultText.textContent =
                `${list.length} search result${
                    list.length === 1
                        ? ""
                        : "s"
                }`;
        }
    }


    list.forEach(
        contact =>
        {
            contactGrid.appendChild(
                createContactCard(
                    contact
                )
            );
        }
    );
}


function renderCurrentView()
{
    if (
        currentView ===
        "favorites"
    )
    {
        renderContacts(
            contacts.filter(
                contact =>
                    isFavorite(
                        contact.phone
                    )
            )
        );

        return;
    }


    renderContacts(
        contacts
    );
}


/* ============================================================
   CONTACT CARD
   ============================================================ */

function createContactCard(
    contact
)
{
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
    )
    {
        card.classList.add(
            "is-favorite"
        );
    }


    card.addEventListener(
        "click",
        function(event)
        {
            if (
                event.target.closest(
                    "button"
                )
            )
            {
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


    if (photo)
    {
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
    else
    {
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


    /* FAVORITE */

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
        function()
        {
            toggleFavorite(
                contact.phone
            );
        }
    );


    /* EDIT */

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
        function()
        {
            openEditModal(
                contact
            );
        }
    );


    /* DELETE */

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
        function()
        {
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
   SEARCH
   ============================================================ */

async function performSearch()
{
    const query =
        searchInput
            ? searchInput.value.trim()
            : "";


    if (!query)
    {
        renderCurrentView();
        return;
    }


    const normalized =
        normalizePhone(
            query
        );


    /*
       PHONE SEARCH
    */

    if (
        normalized &&
        /^\d+$/.test(
            normalized
        )
    )
    {
        const results =
            contacts.filter(
                contact =>
                    normalizePhone(
                        contact.phone
                    ).includes(
                        normalized
                    )
            );


        renderContacts(
            results
        );


        return;
    }


    /*
       NAME SEARCH
    */

    try
    {
        const response =
            await fetch(
                "/api/search?name=" +
                encodeURIComponent(
                    query
                )
            );


        if (!response.ok)
        {
            throw new Error(
                "Search failed."
            );
        }


        const results =
            await response.json();


        renderContacts(
            results
        );
    }
    catch (error)
    {
        showToast(
            error.message,
            "!"
        );
    }
}


if (searchInput)
{
    searchInput.addEventListener(
        "input",
        function()
        {
            clearTimeout(
                searchTimer
            );


            currentView =
                "all";


            if (favoriteNav)
            {
                favoriteNav.classList.remove(
                    "active"
                );
            }


            if (contactsNav)
            {
                contactsNav.classList.add(
                    "active"
                );
            }


            searchTimer =
                setTimeout(
                    performSearch,
                    250
                );
        }
    );
}


/* ============================================================
   ADD CONTACT
   ============================================================ */

function openAddModal()
{
    editingPhone =
        null;


    modalTitle.textContent =
        "Add Contact";


    contactForm.reset();


    if (photoInput)
    {
        photoInput.value =
            "";
    }


    clearPhotoPreview();


    oldPhoneInput.value =
        "";


    formMessage.textContent =
        "";


    formMessage.className =
        "form-message";


    saveButton.textContent =
        "Save Contact";


    modalOverlay.classList.add(
        "show"
    );


    setTimeout(
        function()
        {
            nameInput.focus();
        },
        100
    );
}


/* ============================================================
   EDIT CONTACT
   ============================================================ */

function openEditModal(
    contact
)
{
    editingPhone =
        contact.phone;


    modalTitle.textContent =
        "Edit Contact";


    nameInput.value =
        contact.name;


    phoneInput.value =
        contact.phone;


    emailInput.value =
        contact.email === "N/A"
            ? ""
            : (
                contact.email ||
                ""
            );


    oldPhoneInput.value =
        contact.phone;


    if (photoInput)
    {
        photoInput.value =
            "";
    }


    showPhotoPreview(
        getContactPhoto(
            contact.phone
        )
    );


    formMessage.textContent =
        "";


    formMessage.className =
        "form-message";


    saveButton.textContent =
        "Update Contact";


    modalOverlay.classList.add(
        "show"
    );


    setTimeout(
        function()
        {
            nameInput.focus();
        },
        100
    );
}


/* ============================================================
   CLOSE CONTACT MODAL
   ============================================================ */

function closeModal()
{
    modalOverlay.classList.remove(
        "show"
    );


    editingPhone =
        null;
}


/* ============================================================
   DUPLICATE DETECTION
   ============================================================ */

function getDuplicateContact(
    phone,
    excludePhone = null
)
{
    const target =
        normalizePhone(
            phone
        );


    const excluded =
        normalizePhone(
            excludePhone
        );


    return contacts.find(
        contact =>
        {
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
   SAVE / UPDATE
   ============================================================ */

if (contactForm)
{
    contactForm.addEventListener(
        "submit",
        async function(event)
        {
            event.preventDefault();


            const name =
                nameInput.value.trim();


            const phone =
                phoneInput.value.trim();


            const email =
                emailInput.value.trim();


            const photoFile =
                photoInput &&
                photoInput.files
                    ? photoInput.files[0]
                    : null;


            if (!name)
            {
                showFormError(
                    "Please enter a name."
                );

                return;
            }


            if (!phone)
            {
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


            if (duplicate)
            {
                showFormError(
                    `A contact with phone number ${duplicate.phone} already exists.`
                );


                showToast(
                    "Duplicate phone number.",
                    "!"
                );


                return;
            }


            try
            {
                let photoData =
                    "";


                if (photoFile)
                {
                    photoData =
                        await resizePhoto(
                            photoFile
                        );
                }


                const formData =
                    new URLSearchParams();


                formData.append(
                    "name",
                    name
                );


                formData.append(
                    "phone",
                    phone
                );


                formData.append(
                    "email",
                    email
                );


                let url;


                if (editingPhone)
                {
                    url =
                        "/api/update";


                    formData.append(
                        "oldPhone",
                        editingPhone
                    );
                }
                else
                {
                    url =
                        "/api/add";
                }


                const response =
                    await fetch(
                        url,
                        {
                            method:
                                "POST",

                            headers:
                            {
                                "Content-Type":
                                    "application/x-www-form-urlencoded"
                            },

                            body:
                                formData.toString()
                        }
                    );


                const result =
                    await response.json();


                if (!result.success)
                {
                    showFormError(
                        result.message
                    );

                    return;
                }


                /* PHOTO */

                if (editingPhone)
                {
                    if (photoData)
                    {
                        setContactPhoto(
                            phone,
                            photoData
                        );


                        if (
                            normalizePhone(
                                editingPhone
                            ) !==
                            normalizePhone(
                                phone
                            )
                        )
                        {
                            removeContactPhoto(
                                editingPhone
                            );
                        }
                    }
                    else if (
                        normalizePhone(
                            editingPhone
                        ) !==
                        normalizePhone(
                            phone
                        )
                    )
                    {
                        moveContactPhoto(
                            editingPhone,
                            phone
                        );
                    }


                    /* FAVORITE */

                    moveFavorite(
                        editingPhone,
                        phone
                    );
                }
                else if (photoData)
                {
                    setContactPhoto(
                        phone,
                        photoData
                    );
                }


                closeModal();


                await loadContacts();


                showToast(
                    result.message,
                    "✓"
                );
            }
            catch (error)
            {
                if (
                    error.message ===
                    "Please select an image file."
                )
                {
                    showFormError(
                        error.message
                    );
                }
                else
                {
                    showFormError(
                        "Could not connect to server."
                    );
                }
            }
        }
    );
}


/* ============================================================
   PHOTO INPUT
   ============================================================ */

if (photoInput)
{
    photoInput.addEventListener(
        "change",
        async function()
        {
            const file =
                photoInput.files[0];


            if (!file)
            {
                clearPhotoPreview();

                return;
            }


            try
            {
                const preview =
                    await resizePhoto(
                        file
                    );


                showPhotoPreview(
                    preview
                );
            }
            catch (error)
            {
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
   DELETE
   ============================================================ */

function openDeleteModal(
    contact
)
{
    deletingPhone =
        contact.phone;


    deleteText.textContent =
        `Are you sure you want to delete ${contact.name}?`;


    deleteOverlay.classList.add(
        "show"
    );
}


function closeDeleteModal()
{
    deleteOverlay.classList.remove(
        "show"
    );


    deletingPhone =
        null;
}


const confirmDelete =
    document.getElementById(
        "confirmDelete"
    );


if (confirmDelete)
{
    confirmDelete.addEventListener(
        "click",
        async function()
        {
            if (!deletingPhone)
                return;


            const phoneToDelete =
                deletingPhone;


            const formData =
                new URLSearchParams();


            formData.append(
                "phone",
                phoneToDelete
            );


            try
            {
                const response =
                    await fetch(
                        "/api/delete",
                        {
                            method:
                                "POST",

                            headers:
                            {
                                "Content-Type":
                                    "application/x-www-form-urlencoded"
                            },

                            body:
                                formData.toString()
                        }
                    );


                const result =
                    await response.json();


                closeDeleteModal();


                if (!result.success)
                {
                    showToast(
                        result.message,
                        "!"
                    );

                    return;
                }


                removeContactPhoto(
                    phoneToDelete
                );


                favoritePhones.delete(
                    normalizePhone(
                        phoneToDelete
                    )
                );


                saveFavorites();


                await loadContacts();


                showToast(
                    result.message,
                    "✓"
                );
            }
            catch
            {
                showToast(
                    "Could not connect to server.",
                    "!"
                );
            }
        }
    );
}


/* ============================================================
   SORT
   ============================================================ */

function sortContactsAZ(
    showMessage = true
)
{
    contacts.sort(
        (a, b) =>
            a.name.localeCompare(
                b.name,
                undefined,
                {
                    sensitivity:
                        "base"
                }
            )
    );


    renderCurrentView();


    if (showMessage)
    {
        showToast(
            "Contacts sorted A → Z",
            "✓"
        );
    }
}


const sortButton =
    document.getElementById(
        "sortButton"
    );


if (sortButton)
{
    sortButton.addEventListener(
        "click",
        function()
        {
            sortContactsAZ();
        }
    );
}


/* ============================================================
   BUTTON EVENTS
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

if (favoriteNav)
{
    favoriteNav.addEventListener(
        "click",
        function()
        {
            currentView =
                "favorites";


            if (searchInput)
            {
                searchInput.value =
                    "";
            }


            favoriteNav.classList.add(
                "active"
            );


            if (contactsNav)
            {
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

if (contactsNav)
{
    contactsNav.addEventListener(
        "click",
        function()
        {
            currentView =
                "all";


            if (searchInput)
            {
                searchInput.value =
                    "";
            }


            if (favoriteNav)
            {
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

if (favoriteContactsCount)
{
    const favoriteCard =
        favoriteContactsCount.closest(
            ".stat-card"
        );


    if (favoriteCard)
    {
        favoriteCard.style.cursor =
            "pointer";


        favoriteCard.addEventListener(
            "click",
            function()
            {
                if (favoriteNav)
                {
                    favoriteNav.click();
                }
            }
        );
    }
}


/* ============================================================
   TOTAL CONTACTS STAT CARD
   ============================================================ */

if (totalContacts)
{
    const totalCard =
        totalContacts.closest(
            ".stat-card"
        );


    if (totalCard)
    {
        totalCard.style.cursor =
            "pointer";


        totalCard.addEventListener(
            "click",
            function()
            {
                if (contactsNav)
                {
                    contactsNav.click();
                }
            }
        );
    }
}


/* ============================================================
   SIDEBAR
   ============================================================ */

/*
   IMPORTANT:

   The hamburger button ALWAYS stays as ☰.

   We do NOT change it to × when the
   sidebar is collapsed.
*/

function setHamburgerIcon()
{
    if (!sidebarToggle)
        return;


    sidebarToggle.innerHTML =
        "☰";


    sidebarToggle.setAttribute(
        "aria-label",
        "Toggle sidebar"
    );
}


function setSidebarCollapsed(
    collapsed
)
{
    if (!app)
        return;


    app.classList.toggle(
        "sidebar-collapsed",
        collapsed
    );


    document.body.classList.toggle(
        "sidebar-collapsed",
        collapsed
    );


    /*
       Keep hamburger icon permanently.
    */

    setHamburgerIcon();


    if (sidebarToggle)
    {
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


function toggleSidebar()
{
    if (!app)
        return;


    const collapsed =
        app.classList.contains(
            "sidebar-collapsed"
        );


    setSidebarCollapsed(
        !collapsed
    );
}


if (sidebarToggle)
{
    /*
       Force hamburger icon immediately.
    */

    setHamburgerIcon();


    sidebarToggle.addEventListener(
        "click",
        toggleSidebar
    );
}


/* ============================================================
   SEARCH SIDEBAR BUTTON
   ============================================================ */

if (searchNav)
{
    searchNav.addEventListener(
        "click",
        function()
        {
            if (searchInput)
            {
                searchInput.focus();

                searchInput.select();
            }
        }
    );
}


/* ============================================================
   SORT SIDEBAR BUTTON
   ============================================================ */

if (sortNav)
{
    sortNav.addEventListener(
        "click",
        function()
        {
            sortContactsAZ();
        }
    );
}


/* ============================================================
   STATISTICS SIDEBAR BUTTON
   ============================================================ */

if (statsNav)
{
    statsNav.addEventListener(
        "click",
        function()
        {
            const stats =
                document.querySelector(
                    ".stats"
                );


            if (stats)
            {
                stats.scrollIntoView(
                    {
                        behavior:
                            "smooth",

                        block:
                            "start"
                    }
                );
            }
        }
    );
}


/* ============================================================
   DARK MODE
   ============================================================ */

function updateThemeButton()
{
    if (!themeButton)
        return;


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


function toggleTheme()
{
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


if (themeButton)
{
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
)
{
    document.body.dataset.background =
        value;


    localStorage.setItem(
        BACKGROUND_KEY,
        value
    );
}


if (backgroundSelect)
{
    backgroundSelect.addEventListener(
        "change",
        function(event)
        {
            changeBackground(
                event.target.value
            );
        }
    );
}


function applySavedSettings()
{
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


    if (backgroundSelect)
    {
        backgroundSelect.value =
            background;
    }


    updateThemeButton();
}


/* ============================================================
   CONTACT DETAILS POPUP
   ============================================================ */

function openDetailsModal(
    contact
)
{
    if (!detailsOverlay)
        return;


    detailsContact =
        contact;


    detailsName.textContent =
        contact.name;


    detailsPhone.textContent =
        contact.phone;


    detailsEmail.textContent =
        contact.email ||
        "N/A";


    if (
        isFavorite(
            contact.phone
        )
    )
    {
        detailsFavorite.textContent =
            "★ Favorite";
    }
    else
    {
        detailsFavorite.textContent =
            "☆ Not Favorite";
    }


    const photo =
        getContactPhoto(
            contact.phone
        );


    detailsPhoto.innerHTML =
        "";


    if (photo)
    {
        const image =
            document.createElement(
                "img"
            );


        image.src =
            photo;


        image.alt =
            `${contact.name} profile photo`;


        detailsPhoto.appendChild(
            image
        );
    }
    else
    {
        detailsPhoto.textContent =
            getInitials(
                contact.name
            );
    }


    detailsOverlay.classList.add(
        "show"
    );
}


function closeDetailsModal()
{
    if (!detailsOverlay)
        return;


    detailsOverlay.classList.remove(
        "show"
    );


    detailsContact =
        null;
}


if (closeDetails)
{
    closeDetails.addEventListener(
        "click",
        closeDetailsModal
    );
}


if (detailsOverlay)
{
    detailsOverlay.addEventListener(
        "click",
        function(event)
        {
            if (
                event.target ===
                detailsOverlay
            )
            {
                closeDetailsModal();
            }
        }
    );
}


/* DETAILS EDIT */

if (detailsEdit)
{
    detailsEdit.addEventListener(
        "click",
        function()
        {
            if (!detailsContact)
                return;


            const contact =
                detailsContact;


            closeDetailsModal();


            openEditModal(
                contact
            );
        }
    );
}


/* DETAILS DELETE */

if (detailsDelete)
{
    detailsDelete.addEventListener(
        "click",
        function()
        {
            if (!detailsContact)
                return;


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
   OVERLAY CLOSE
   ============================================================ */

if (modalOverlay)
{
    modalOverlay.addEventListener(
        "click",
        function(event)
        {
            if (
                event.target ===
                modalOverlay
            )
            {
                closeModal();
            }
        }
    );
}


if (deleteOverlay)
{
    deleteOverlay.addEventListener(
        "click",
        function(event)
        {
            if (
                event.target ===
                deleteOverlay
            )
            {
                closeDeleteModal();
            }
        }
    );
}


/* ============================================================
   ESCAPE KEY
   ============================================================ */

document.addEventListener(
    "keydown",
    function(event)
    {
        if (
            event.key !==
            "Escape"
        )
        {
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

const savedSidebarState =
    localStorage.getItem(
        SIDEBAR_KEY
    );


/*
   FIXED SIDEBAR STARTUP

   Previously the code automatically collapsed
   the sidebar when:

       savedSidebarState === null
       AND
       window.innerWidth <= 800

   That caused the sidebar to start closed on
   smaller screens.

   Now:
       "1" = collapsed
       anything else = open
*/

setSidebarCollapsed(
    savedSidebarState === "1"
);


applySavedSettings();

updateFavoriteCount();

loadContacts();