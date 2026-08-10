#include <winsock2.h>
#include <ws2tcpip.h>

#include <algorithm>
#include <cctype>
#include <cstdio>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#pragma comment(lib, "ws2_32.lib")

using namespace std;

/* ============================================================
                        CONFIGURATION
   ============================================================ */

const int PORT = 8081;
const string DATA_FILE = "contacts.txt";


/* ============================================================
                        CONTACT STRUCTURE
   ============================================================ */

struct Contact
{
    string name;
    string phone;
    string email;
};

vector<Contact> contacts;


/* ============================================================
                        STRING HELPERS
   ============================================================ */

string trim(const string& str)
{
    size_t start = str.find_first_not_of(" \t\r\n");

    if (start == string::npos)
        return "";

    size_t end = str.find_last_not_of(" \t\r\n");

    return str.substr(start, end - start + 1);
}


string toLower(string text)
{
    transform(
        text.begin(),
        text.end(),
        text.begin(),
        [](unsigned char c)
        {
            return static_cast<char>(tolower(c));
        }
    );

    return text;
}


/* ============================================================
                        URL DECODING
   ============================================================ */

string urlDecode(const string& str)
{
    string result;

    for (size_t i = 0; i < str.length(); i++)
    {
        if (str[i] == '+')
        {
            result += ' ';
        }
        else if (str[i] == '%' && i + 2 < str.length())
        {
            string hex = str.substr(i + 1, 2);

            char ch = static_cast<char>(
                strtol(hex.c_str(), nullptr, 16)
            );

            result += ch;
            i += 2;
        }
        else
        {
            result += str[i];
        }
    }

    return result;
}


/* ============================================================
                        FORM DATA PARSER
   ============================================================ */

vector<pair<string, string>> parseForm(const string& body)
{
    vector<pair<string, string>> data;

    stringstream ss(body);
    string part;

    while (getline(ss, part, '&'))
    {
        size_t equal = part.find('=');

        if (equal != string::npos)
        {
            string key = part.substr(0, equal);
            string value = part.substr(equal + 1);

            data.push_back({
                urlDecode(key),
                urlDecode(value)
            });
        }
    }

    return data;
}


string getFormValue(
    const vector<pair<string, string>>& data,
    const string& key
)
{
    for (const auto& item : data)
    {
        if (item.first == key)
            return item.second;
    }

    return "";
}


/* ============================================================
                        JSON ESCAPE
   ============================================================ */

string jsonEscape(const string& text)
{
    string result;

    for (char c : text)
    {
        switch (c)
        {
            case '\"':
                result += "\\\"";
                break;

            case '\\':
                result += "\\\\";
                break;

            case '\n':
                result += "\\n";
                break;

            case '\r':
                result += "\\r";
                break;

            case '\t':
                result += "\\t";
                break;

            default:
                result += c;
        }
    }

    return result;
}


/* ============================================================
                        SAVE CONTACTS
   ============================================================ */

void saveContacts()
{
    ofstream file(DATA_FILE);

    if (!file)
    {
        cerr << "Error: Could not save contacts.\n";
        return;
    }

    for (const Contact& contact : contacts)
    {
        file << contact.name << "|"
             << contact.phone << "|"
             << contact.email << "\n";
    }
}


/* ============================================================
                        LOAD CONTACTS
   ============================================================ */

void loadContacts()
{
    ifstream file(DATA_FILE);

    if (!file)
    {
        return;
    }

    contacts.clear();

    string line;

    while (getline(file, line))
    {
        stringstream ss(line);

        string name;
        string phone;
        string email;

        getline(ss, name, '|');
        getline(ss, phone, '|');
        getline(ss, email, '|');

        if (!name.empty() && !phone.empty())
        {
            contacts.push_back({
                name,
                phone,
                email
            });
        }
    }
}


/* ============================================================
                        SORT CONTACTS
   ============================================================ */

void sortContacts()
{
    sort(
        contacts.begin(),
        contacts.end(),
        [](const Contact& a, const Contact& b)
        {
            return toLower(a.name) < toLower(b.name);
        }
    );
}


/* ============================================================
                        BINARY SEARCH
   ============================================================ */

int binarySearchByName(const string& name)
{
    string target = toLower(trim(name));

    int left = 0;
    int right = static_cast<int>(contacts.size()) - 1;

    while (left <= right)
    {
        int middle = left + (right - left) / 2;

        string current = toLower(contacts[middle].name);

        if (current == target)
        {
            return middle;
        }

        if (current < target)
        {
            left = middle + 1;
        }
        else
        {
            right = middle - 1;
        }
    }

    return -1;
}


/* ============================================================
                    SEARCH PARTIAL NAME
   ============================================================ */
/* ============================================================
                    SEARCH CONTACTS
        Search by NAME or PHONE NUMBER
   ============================================================ */

vector<Contact> searchContacts(const string& query)
{
    vector<Contact> results;

    string search = trim(query);
    string searchLower = toLower(search);

    // If search box is empty, return all contacts
    if (search.empty())
    {
        return contacts;
    }

    /*
        ========================================================
        1. EXACT NAME SEARCH
        ========================================================

        Contacts are already sorted by name.

        Therefore binary search can be used here.
    */

    int exactNameIndex = binarySearchByName(search);

    if (exactNameIndex != -1)
    {
        results.push_back(contacts[exactNameIndex]);
    }


    /*
        ========================================================
        2. EXACT PHONE SEARCH
        ========================================================

        Create a temporary copy and sort it by phone number.

        This allows us to demonstrate binary search for
        phone-number searching as well.
    */

    vector<Contact> phoneSorted = contacts;

    sort(
        phoneSorted.begin(),
        phoneSorted.end(),
        [](const Contact& a, const Contact& b)
        {
            return a.phone < b.phone;
        }
    );


    int left = 0;
    int right = static_cast<int>(phoneSorted.size()) - 1;
    int exactPhoneIndex = -1;

    while (left <= right)
    {
        int middle = left + (right - left) / 2;

        if (phoneSorted[middle].phone == search)
        {
            exactPhoneIndex = middle;
            break;
        }

        if (phoneSorted[middle].phone < search)
        {
            left = middle + 1;
        }
        else
        {
            right = middle - 1;
        }
    }


    /*
        Add exact phone result if it was found.
        Avoid adding the same contact twice.
    */

    if (exactPhoneIndex != -1)
    {
        const Contact& phoneContact =
            phoneSorted[exactPhoneIndex];

        bool alreadyAdded = false;

        for (const Contact& contact : results)
        {
            if (contact.phone == phoneContact.phone)
            {
                alreadyAdded = true;
                break;
            }
        }

        if (!alreadyAdded)
        {
            results.push_back(phoneContact);
        }
    }


    /*
        ========================================================
        3. PARTIAL NAME OR PHONE SEARCH
        ========================================================

        This makes the search box more convenient.

        Examples:

        "fah"       -> Fahim, fahad
        "0192"      -> 01926589146
        "gmail"     -> contacts containing gmail in name
                       or phone
    */

    for (const Contact& contact : contacts)
    {
        string nameLower = toLower(contact.name);
        string phone = contact.phone;

        bool nameMatch =
            nameLower.find(searchLower) != string::npos;

        bool phoneMatch =
            phone.find(search) != string::npos;

        if (nameMatch || phoneMatch)
        {
            bool alreadyAdded = false;

            for (const Contact& existing : results)
            {
                if (existing.phone == contact.phone)
                {
                    alreadyAdded = true;
                    break;
                }
            }

            if (!alreadyAdded)
            {
                results.push_back(contact);
            }
        }
    }


    /*
        Keep the results sorted by name so the UI
        remains consistent with the rest of the application.
    */

    sort(
        results.begin(),
        results.end(),
        [](const Contact& a, const Contact& b)
        {
            return toLower(a.name) < toLower(b.name);
        }
    );

    return results;
}


/* ============================================================
                    DUPLICATE PHONE CHECK
   ============================================================ */

int findPhone(const string& phone)
{
    string target = trim(phone);

    for (int i = 0; i < static_cast<int>(contacts.size()); i++)
    {
        if (contacts[i].phone == target)
        {
            return i;
        }
    }

    return -1;
}


/* ============================================================
                        JSON CONTACT
   ============================================================ */

string contactToJson(const Contact& contact)
{
    stringstream json;

    json << "{"
         << "\"name\":\"" << jsonEscape(contact.name) << "\","
         << "\"phone\":\"" << jsonEscape(contact.phone) << "\","
         << "\"email\":\"" << jsonEscape(contact.email) << "\""
         << "}";

    return json.str();
}


/* ============================================================
                        JSON CONTACT LIST
   ============================================================ */

string contactsToJson(const vector<Contact>& list)
{
    stringstream json;

    json << "[";

    for (size_t i = 0; i < list.size(); i++)
    {
        if (i > 0)
            json << ",";

        json << contactToJson(list[i]);
    }

    json << "]";

    return json.str();
}


/* ============================================================
                        HTTP RESPONSE
   ============================================================ */

string httpResponse(
    const string& body,
    const string& contentType = "text/html",
    int statusCode = 200,
    const string& statusText = "OK"
)
{
    stringstream response;

    response << "HTTP/1.1 "
             << statusCode
             << " "
             << statusText
             << "\r\n";

    response << "Content-Type: "
             << contentType
             << "; charset=UTF-8\r\n";

    response << "Content-Length: "
             << body.size()
             << "\r\n";

    response << "Access-Control-Allow-Origin: *\r\n";

    response << "Connection: close\r\n";

    response << "\r\n";

    response << body;

    return response.str();
}


/* ============================================================
                        ERROR RESPONSE
   ============================================================ */

string errorResponse(
    const string& message,
    int statusCode = 400
)
{
    string body =
        "{\"success\":false,\"message\":\"" +
        jsonEscape(message) +
        "\"}";

    string statusText =
        statusCode == 404
            ? "Not Found"
            : "Bad Request";

    return httpResponse(
        body,
        "application/json",
        statusCode,
        statusText
    );
}


/* ============================================================
                        SUCCESS RESPONSE
   ============================================================ */

string successResponse(
    const string& message
)
{
    string body =
        "{\"success\":true,\"message\":\"" +
        jsonEscape(message) +
        "\"}";

    return httpResponse(
        body,
        "application/json"
    );
}


/* ============================================================
                        FILE READER
   ============================================================ */

string readFile(const string& path)
{
    ifstream file(path, ios::binary);

    if (!file)
    {
        return "";
    }

    stringstream buffer;

    buffer << file.rdbuf();

    return buffer.str();
}


/* ============================================================
                    MIME TYPE
   ============================================================ */

string getMimeType(const string& path)
{
    if (path.size() >= 5 &&
        path.compare(path.size() - 5, 5, ".html") == 0)
    {
        return "text/html";
    }

    if (path.size() >= 4 &&
        path.compare(path.size() - 4, 4, ".css") == 0)
    {
        return "text/css";
    }

    if (path.size() >= 3 &&
        path.compare(path.size() - 3, 3, ".js") == 0)
    {
        return "application/javascript";
    }

    if (path.size() >= 5 &&
        path.compare(path.size() - 5, 5, ".json") == 0)
    {
        return "application/json";
    }

    return "text/plain";
}


/* ============================================================
                    API: GET CONTACTS
   ============================================================ */

string handleGetContacts()
{
    sortContacts();

    return httpResponse(
        contactsToJson(contacts),
        "application/json"
    );
}


/* ============================================================
                    API: SEARCH
   ============================================================ */

string handleSearch(const string& query)
{
    sortContacts();

    vector<Contact> results =
        searchContacts(query);

    return httpResponse(
        contactsToJson(results),
        "application/json"
    );
}


/* ============================================================
                    API: ADD CONTACT
   ============================================================ */

string handleAdd(const string& body)
{
    vector<pair<string, string>> data =
        parseForm(body);

    string name =
        trim(getFormValue(data, "name"));

    string phone =
        trim(getFormValue(data, "phone"));

    string email =
        trim(getFormValue(data, "email"));

    if (name.empty())
    {
        return errorResponse(
            "Name is required."
        );
    }

    if (phone.empty())
    {
        return errorResponse(
            "Phone number is required."
        );
    }

    if (findPhone(phone) != -1)
    {
        return errorResponse(
            "A contact with this phone number already exists."
        );
    }

    if (email.empty())
    {
        email = "N/A";
    }

    contacts.push_back({
        name,
        phone,
        email
    });

    sortContacts();

    saveContacts();

    return successResponse(
        "Contact added successfully."
    );
}


/* ============================================================
                    API: UPDATE CONTACT
   ============================================================ */

string handleUpdate(const string& body)
{
    vector<pair<string, string>> data =
        parseForm(body);

    string oldPhone =
        trim(getFormValue(data, "oldPhone"));

    string name =
        trim(getFormValue(data, "name"));

    string phone =
        trim(getFormValue(data, "phone"));

    string email =
        trim(getFormValue(data, "email"));

    if (oldPhone.empty())
    {
        return errorResponse(
            "Original phone number is required."
        );
    }

    int index = findPhone(oldPhone);

    if (index == -1)
    {
        return errorResponse(
            "Contact not found.",
            404
        );
    }

    if (name.empty())
    {
        return errorResponse(
            "Name is required."
        );
    }

    if (phone.empty())
    {
        return errorResponse(
            "Phone number is required."
        );
    }

    int duplicate = findPhone(phone);

    if (duplicate != -1 && duplicate != index)
    {
        return errorResponse(
            "That phone number belongs to another contact."
        );
    }

    if (email.empty())
    {
        email = "N/A";
    }

    contacts[index].name = name;
    contacts[index].phone = phone;
    contacts[index].email = email;

    sortContacts();

    saveContacts();

    return successResponse(
        "Contact updated successfully."
    );
}


/* ============================================================
                    API: DELETE CONTACT
   ============================================================ */

string handleDelete(const string& body)
{
    vector<pair<string, string>> data =
        parseForm(body);

    string phone =
        trim(getFormValue(data, "phone"));

    if (phone.empty())
    {
        return errorResponse(
            "Phone number is required."
        );
    }

    int index = findPhone(phone);

    if (index == -1)
    {
        return errorResponse(
            "Contact not found.",
            404
        );
    }

    contacts.erase(
        contacts.begin() + index
    );

    saveContacts();

    return successResponse(
        "Contact deleted successfully."
    );
}


/* ============================================================
                    HTTP REQUEST HANDLER
   ============================================================ */

void handleClient(SOCKET client)
{
    char buffer[8192];

    int received =
        recv(
            client,
            buffer,
            sizeof(buffer) - 1,
            0
        );

    if (received <= 0)
    {
        closesocket(client);
        return;
    }

    buffer[received] = '\0';

    string request(buffer);

    /*
        Separate headers and body
    */

    size_t headerEnd =
        request.find("\r\n\r\n");

    string headers;
    string body;

    if (headerEnd != string::npos)
    {
        headers = request.substr(
            0,
            headerEnd
        );

        body = request.substr(
            headerEnd + 4
        );
    }
    else
    {
        headers = request;
    }

    /*
        First request line
    */

    size_t firstLineEnd =
        request.find("\r\n");

    if (firstLineEnd == string::npos)
    {
        closesocket(client);
        return;
    }

    string requestLine =
        request.substr(
            0,
            firstLineEnd
        );

    string method;
    string path;
    string version;

    stringstream requestStream(
        requestLine
    );

    requestStream >>
        method >>
        path >>
        version;


    /* ========================================================
                            API ROUTES
       ======================================================== */

    string response;


    /*
        GET /api/contacts
    */

    if (method == "GET" &&
        path == "/api/contacts")
    {
        response =
            handleGetContacts();
    }


    /*
        GET /api/search?name=...
    */

    else if (
        method == "GET" &&
        path.rfind("/api/search", 0) == 0
    )
    {
        string query;

        size_t question =
            path.find('?');

        if (question != string::npos)
        {
            string queryString =
                path.substr(question + 1);

            vector<pair<string, string>> params =
                parseForm(queryString);

            query =
                getFormValue(
                    params,
                    "name"
                );
        }

        response =
            handleSearch(query);
    }


    /*
        POST /api/add
    */

    else if (
        method == "POST" &&
        path == "/api/add"
    )
    {
        response =
            handleAdd(body);
    }


    /*
        POST /api/update
    */

    else if (
        method == "POST" &&
        path == "/api/update"
    )
    {
        response =
            handleUpdate(body);
    }


    /*
        POST /api/delete
    */

    else if (
        method == "POST" &&
        path == "/api/delete"
    )
    {
        response =
            handleDelete(body);
    }


    /* ========================================================
                            STATIC FILES
       ======================================================== */

    else
    {
        string filePath;

        if (path == "/")
        {
            filePath =
                "web/index.html";
        }
        else if (path == "/style.css")
        {
            filePath =
                "web/style.css";
        }
        else if (path == "/script.js")
        {
            filePath =
                "web/script.js";
        }
        else
        {
            response =
                errorResponse(
                    "Page not found.",
                    404
                );

            send(
                client,
                response.c_str(),
                static_cast<int>(response.size()),
                0
            );

            closesocket(client);

            return;
        }

        string content =
            readFile(filePath);

        if (content.empty())
        {
            response =
                errorResponse(
                    "Could not load website file.",
                    404
                );
        }
        else
        {
            response =
                httpResponse(
                    content,
                    getMimeType(filePath)
                );
        }
    }


    send(
        client,
        response.c_str(),
        static_cast<int>(response.size()),
        0
    );

    closesocket(client);
}


/* ============================================================
                            MAIN
   ============================================================ */

int main()
{
    cout << "\n";
    cout << "=====================================================\n";
    cout << "                 PHONEBOOK SERVER                  \n";
    cout << "=====================================================\n";

    /*
        Load existing contacts
    */

    loadContacts();

    sortContacts();

    cout << "\nLoaded contacts: "
         << contacts.size()
         << "\n";


    /* ========================================================
                        START WINSOCK
       ======================================================== */

    WSADATA wsaData;

    int result =
        WSAStartup(
            MAKEWORD(2, 2),
            &wsaData
        );

    if (result != 0)
    {
        cerr << "WSAStartup failed.\n";
        return 1;
    }


    /* ========================================================
                        CREATE SOCKET
       ======================================================== */

    SOCKET serverSocket =
        socket(
            AF_INET,
            SOCK_STREAM,
            IPPROTO_TCP
        );

    if (serverSocket == INVALID_SOCKET)
    {
        cerr << "Could not create socket.\n";

        WSACleanup();

        return 1;
    }


    /* ========================================================
                        SERVER ADDRESS
       ======================================================== */

    sockaddr_in serverAddress{};

    serverAddress.sin_family =
        AF_INET;

    serverAddress.sin_addr.s_addr =
        inet_addr("127.0.0.1");

    serverAddress.sin_port =
        htons(PORT);


    /* ========================================================
                            BIND
       ======================================================== */

    if (
        bind(
            serverSocket,
            reinterpret_cast<sockaddr*>(
                &serverAddress
            ),
            sizeof(serverAddress)
        ) == SOCKET_ERROR
    )
    {
        cerr << "Bind failed. Port "
             << PORT
             << " may already be in use.\n";

        closesocket(serverSocket);

        WSACleanup();

        return 1;
    }


    /* ========================================================
                            LISTEN
       ======================================================== */

    if (
        listen(
            serverSocket,
            SOMAXCONN
        ) == SOCKET_ERROR
    )
    {
        cerr << "Listen failed.\n";

        closesocket(serverSocket);

        WSACleanup();

        return 1;
    }


    cout << "\nServer started successfully!\n";
    cout << "\nOpen your browser and visit:\n";
    cout << "\n";
    cout << "    http://localhost:" << PORT << "\n";
    cout << "\n";
    cout << "Keep this terminal running.\n";
    cout << "Press Ctrl+C to stop the server.\n";
    cout << "\n";


    /* ========================================================
                        SERVER LOOP
       ======================================================== */

    while (true)
    {
        sockaddr_in clientAddress{};

        int clientSize =
            sizeof(clientAddress);

        SOCKET client =
            accept(
                serverSocket,
                reinterpret_cast<sockaddr*>(
                    &clientAddress
                ),
                &clientSize
            );

        if (client == INVALID_SOCKET)
        {
            continue;
        }

        handleClient(client);
    }


    closesocket(serverSocket);

    WSACleanup();

    return 0;
}