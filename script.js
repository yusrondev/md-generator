$(document).ready(function () {
    let flag_drive = 0;
    let isDragging = false;

    // Handling the Enter key in the input field
    $('body').on('keydown', function (event) {
        if (event.key === "Enter" || event.keyCode === 13) {
            $('.welcome-section').hide();
            $('.cms-section').show();

            if (flag_drive == 0) {
                const driver = window.driver.js.driver;
                const driverObj = driver();

                driverObj.highlight({
                    element: "#head1",
                    popover: {
                        title: "Tahan dan tarik!",
                        description: "Tahan dan tarik bagian ini untuk menambahkan konten"
                    }
                });
                flag_drive++;
            }
        }
    });

    $('.start-btn').click(function () {
        $('.welcome-section').hide();
        $('.cms-section').show();
    });

    // Make items draggable
    $(".draggable-item").draggable({
        helper: "clone",
        revert: "invalid",
        start: function () {
            isDragging = true; // Set dragging flag to true on drag start
            $('#drop-placeholder').addClass("highlight-text");
            $('.droppable-area').addClass('dashed');
            $('#drop-placeholder').html("Wah pilihan yang bagus! sekarang tinggal taruh di sini!");
        },
        stop: function () {
            $('#drop-placeholder').removeClass("highlight-text");
            $('.droppable-area').removeClass('dashed');
            $('#drop-placeholder').html("Yang barusan itu hampir saja, tarik lagi dong 😟");
            isDragging = false; // Reset dragging flag on drag stop
        }
    });


    let codeMirrorInstances = [];

    // Make the drop area droppable
    $(".droppable-area").droppable({
        accept: ".draggable-item", // Accept only draggable items
        drop: function (event, ui) {
            // Remove the "Drop Here" text when the first item is dropped
            $('#drop-placeholder').remove();

            // Get the type of element being dragged
            let itemType = $(ui.helper).data('type');
            let newElement;

            // Create a new HTML element based on the type
            if (itemType.startsWith('heading')) {
                let tagH = itemType.replace('heading', '');
                newElement = $(`<h${tagH} contenteditable="true" data-placeholder="Heading ${tagH}" class="dropped-item" tabindex="0"></h${tagH}>`);
            } else if (itemType === 'paragraph') {
                newElement = $('<p contenteditable="true" class="dropped-item" data-placeholder="Senantiasalah menjaga persepsimu..." tabindex="0"></p>');
            } else if (itemType === 'lang-php' || itemType === 'lang-js') {
                // Wrap the CodeMirror element and delete button
                let wrapper = $('<div class="dropped-item code-wrapper" tabindex="0"></div>');
                newElement = $(`<textarea data-lang="${itemType.split('-')[1]}" id="code${$('.CodeMirror').length}" name="code" class="dropped-item"></textarea>`);

                // Add delete button
                let deleteBtn = $('<button class="delete-btn" title="Delete">&#10006;</button>');
                deleteBtn.click(function () {
                    // Remove both CodeMirror and wrapper when delete is clicked
                    wrapper.remove();
                    const codeMirrorInstance = codeMirrorInstances.find(instance => instance.element[0] === newElement[0]);
                    if (codeMirrorInstance) {
                        codeMirrorInstance.editor.toTextArea(); // Destroy CodeMirror instance
                        codeMirrorInstances = codeMirrorInstances.filter(instance => instance.element[0] !== newElement[0]);
                    }

                    let count_item = 0;
                    $('.droppable-area').each(function () {
                        // 'this' refers to the current .droppable-area element
                        $(this).find('.dropped-item').each(function (k, v) {
                            count_item++;
                        });
                    });

                    if (count_item == 0) {
                        $('.droppable-area').append(`<p id="drop-placeholder" class="lexend-bold">Yah terhapus semua deh, mulai lagi gak nih?</p>`);
                    }
                });

                // Append the textarea and delete button to the wrapper
                wrapper.append(newElement);
                wrapper.append(deleteBtn);
                
                newElement = wrapper; // Use wrapper as the newElement
            }

            // Append the newly created element to the drop area at the cursor position
            if (newElement) {
                // Calculate the position where the item should be inserted
                let dropArea = $(this);
                let offset = dropArea.offset();
                let mouseY = event.pageY - offset.top; // Calculate Y position relative to droppable area

                // Find the closest dropped item to the cursor position
                let closestItem = null;
                dropArea.children('.dropped-item').each(function () {
                    let thisOffset = $(this).offset().top - offset.top; // Position of the current child
                    if (mouseY < thisOffset) {
                        closestItem = $(this);
                        return false; // Break loop
                    }
                });

                // Insert the new element before the closest item or at the end if none found
                if (closestItem) {
                    newElement.insertBefore(closestItem);
                } else {
                    dropArea.append(newElement);
                }

                attachKeyboardNavigation(newElement); // Attach keyboard navigation

                // Initialize CodeMirror if applicable
                if (itemType === 'lang-js' || itemType === 'lang-php') {
                    let mode = itemType.split('-')[1]; // Get language mode (php or js)
                    if (mode === "js" || mode === "php") {
                        mode = "javascript";
                    }
                    let editor = CodeMirror.fromTextArea(newElement.find('textarea')[0], {
                        lineNumbers: true,
                        mode: mode,
                        theme: 'material-darker',
                        tabSize: 2,
                        matchBrackets: true,
                        autoCloseBrackets: true
                    });
                    codeMirrorInstances.push({ element: newElement.find('textarea'), editor: editor });
                }

                newElement.focus(); // Focus the new element for immediate editing
            }
        }
    });

    // Attach keyboard navigation to the new element
    function attachKeyboardNavigation(newElement) {
        newElement.on("keydown", function (e) {
            let currentElement = $(this);
            let target_elem_prev = currentElement.prev();
            let target_elem_next = currentElement.next();

            // Check if Ctrl + Delete is pressed to remove non-CodeMirror elements
            if (e.ctrlKey && e.key === "Delete") {
                if (!currentElement.hasClass('code-wrapper')) {
                    currentElement.remove(); // Remove non-CodeMirror element
                    if (target_elem_next.length > 0) {
                        target_elem_next.focus();
                    } else {
                        target_elem_prev.focus();
                    }

                    let count_item = 0;
                    $('.droppable-area').each(function () {
                        // 'this' refers to the current .droppable-area element
                        $(this).find('.dropped-item').each(function (k, v) {
                            count_item++;
                        });
                    });

                    if (count_item == 0) {
                        $('.droppable-area').append(`<p id="drop-placeholder" class="lexend-bold">Yah terhapus semua deh, mulai lagi gak nih?</p>`);
                    }
                }
            }

            // Check if Ctrl is pressed along with the ArrowUp key
            if (e.ctrlKey && e.key === "ArrowUp") {
                let prevElement = currentElement.prev(".dropped-item");
                if (prevElement.length) {
                    currentElement.insertBefore(prevElement);
                    currentElement.focus();
                }
            }
            // Check if Ctrl is pressed along with the ArrowDown key
            else if (e.ctrlKey && e.key === "ArrowDown") {
                let nextElement = currentElement.next(".dropped-item");
                if (nextElement.length) {
                    currentElement.insertAfter(nextElement);
                    currentElement.focus();
                }
            }
        });

        // Attach to CodeMirror editor if applicable
        if (newElement.find('textarea').data('lang')) {
            const codeMirrorInstance = codeMirrorInstances.find(instance => instance.element[0] === newElement.find('textarea')[0]);
            if (codeMirrorInstance) {
                // Listen for keydown events on the CodeMirror instance
            }
        }
    }

    $(document).keydown(function (event) {
        if (event.ctrlKey && event.keyCode === 83) { // Ctrl + S
            event.preventDefault();
            let markdownContent = "";
            let file_name = "";
            let count = 0;

            // Loop through dropped elements and generate markdown
            $(".droppable-area").children().each(function () {
                let tagName = $(this).prop("tagName").toLowerCase();
                let lang = $(this).find('textarea').data('lang');
                let textContent = $(this).text().trim();
                let value = $(this).find('textarea').val();
                if (count === 0) {
                    file_name = textContent;
                }

                if (tagName === "h1") {
                    markdownContent += `# ${textContent}\n\n`; // Convert <h1> to # Heading 1
                } else if (tagName === "h2") {
                    markdownContent += `## ${textContent}\n\n`; // Convert <h2> to ## Heading 2
                } else if (tagName === "h3") {
                    markdownContent += `### ${textContent}\n\n`; // Convert <h3> to ### Heading 3
                } else if (tagName === "h4") {
                    markdownContent += `#### ${textContent}\n\n`; // Convert <h4> to #### Heading 4
                } else if (tagName === "h5") {
                    markdownContent += `##### ${textContent}\n\n`; // Convert <h5> to ##### Heading 5
                } else if (tagName === "p" || tagName === "div") {
                    // Check if this element has a textarea inside (CodeMirror wrapper)
                    let textarea = $(this).find('textarea')[0];
                    if (textarea) {
                        // Find the corresponding CodeMirror instance by the textarea
                        let codeMirrorInstance = codeMirrorInstances.find(instance => instance.element[0] === textarea);
                        if (codeMirrorInstance) {
                            value = codeMirrorInstance.editor.getValue(); // Get value from CodeMirror
                        } else {
                            value = $(this).text().trim(); // Use plain text if not CodeMirror
                        }
                        markdownContent += "```" + (lang || '') + "\n" + value + "\n```\n\n"; // Markdown code block
                    } else {
                        value = $(this).text().trim(); // Use plain text for paragraphs
                        markdownContent += `${value}\n\n`; // Markdown for normal text
                    }
                }                
                count++;
            });

            // Create a .md file and download
            let blob = new Blob([markdownContent], { type: "text/markdown" });
            let link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = file_name + ".md"; // Name the file
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        if (event.ctrlKey && event.key === 'b') {
            event.preventDefault(); // Prevent default action (if needed)
            $('.sidebar-custom').toggle();
        }
    });

    function loadMarkdownFromFile(file) {
        let reader = new FileReader();
    
        // When file is loaded, parse its content
        reader.onload = function (event) {
            let markdownContent = event.target.result;
    
            // Convert Markdown to HTML using marked.js
            let htmlContent = marked.parse(markdownContent);
    
            // Clear any existing elements in the droppable area
            $(".droppable-area").empty();
    
            // Append the generated HTML to the droppable area
            $(".droppable-area").append(htmlContent);

            $.each($(htmlContent), function(k, v){
                attachKeyboardNavigation($(v));
            })
            
    
            // Add the necessary contenteditable properties
            $(".droppable-area h1, .droppable-area h2, .droppable-area h3, .droppable-area p").attr("contenteditable", "true");
        };
    
        // Read the file as text
        reader.readAsText(file);
    }

    // Handle form submission
    $("#markdown-form").on("submit", function (event) {
        event.preventDefault();

        // Get the selected file
        let file = $("#markdown-file")[0].files[0];
        if (file) {
            // Load the file and generate HTML from it
            loadMarkdownFromFile(file);
        } else {
            alert("Please select a markdown file.");
        }
    });
});
