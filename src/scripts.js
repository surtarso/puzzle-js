const IMAGES_FOLDER_URL = 'https://tarsogalvao.ddns.net/games/puzzle/img/boards/';
let PUZZLE_IMG = null;  //element created for inc video/image signal
let CANVAS = null;  //place where the video element is drawn
let CONTEXT = null;  //access camera methods
let SCALER = 0.8;  //how much screen space will be used by the video (0.8 = 80% == 20% margin)
let SIZE = {x:0, y:0, width:0, height:0, rows:3, columns:3};
let PIECES = [];  // array of jigsaw pieces
let SELECTED_PIECE = null;   // for mouse events
// "score"
let START_TIME = null;
let END_TIME = null;
// sounds in files
let POP_SOUND = new Audio('snd/pop.mp3');
POP_SOUND.volume = 0.8;
// synthesized audio
let AUDIO_CONTEXT = new (AudioContext||webkitAudioContext||window.webkitAudioContext)();
// synth piano keys in hertz (octave 4)
let keys = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392,
    A4: 440,
    B4: 493.88 }
//toggler for camara/image functions
let using_camera = false;
let using_image = false;
//buttons
let MENU_BTN;
let END_BTN;
let DIFF_BTN;
let IMG_BTN;

// ------------------------------------------------------------ MAIN FUNC:
//main function is called in html's <body> "onload"
function main(){
    //define canvas in html
    CANVAS = document.getElementById("myCanvas");
    //use 2d method of the canvas
    CONTEXT = CANVAS.getContext("2d");
    MENU_BTN = document.getElementById('startButton');
    END_BTN = document.getElementById('endButton');
    DIFF_BTN = document.getElementById('difficulty');
    IMG_BTN = document.getElementById('imageSource');
    //hide extra menus
    setMenuDisplay('none');
    //add event listeners for drag n drop operations
    addEventListeners();
}

// ------------------------------------------------------- IMAGE SRC SETTER:
// called in html's <select> dropdown menu
function setImageSource(){
    let src = document.getElementById("imageSource").value;
    switch(src){
        case "none":
            setMenuDisplay('none');
            break;
        case "padrao":
            setMenuDisplay('padrao');
            useBuiltInImage('padrao');
            break;
        case "infantil":
            setMenuDisplay('infantil');
            useBuiltInImage('infantil');
            break;
        case "upload":
            setMenuDisplay('upload');
            useUploadImage();
            break;
        case "webcam":
            setMenuDisplay('webcam');
            useCamera();
            break;
    }
}

//----------------------------------------------------------- MENU DISPLAY:
function setMenuDisplay(string){
    switch(string){
        case 'menu':
            document.getElementById("imageSource").value = 'none';
            document.getElementById("imageInput").style.display = "none";
            document.getElementById("padraoImages").style.display = "none";
            document.getElementById("infantilImages").style.display = "none";
            document.getElementById("endScreen").style.display = "none";
            document.getElementById("menuItems").style.display = "block";
            document.getElementById("startButton").style.display = "none";
            break;
        case 'none':
            document.getElementById("imageInput").style.display = "none";
            document.getElementById("padraoImages").style.display = "none";
            document.getElementById("infantilImages").style.display = "none";
            document.getElementById("startButton").style.display = "none";
            break;
        case 'padrao':
            using_camera = false;
            using_image = true;
            document.getElementById("padraoImages").style.display = "inline";
            document.getElementById("infantilImages").style.display = "none";
            document.getElementById("imageInput").style.display = "none";
            document.getElementById("startButton").style.display = "inline";
            break;
        case 'infantil':
            using_camera = false;
            using_image = true;
            document.getElementById("padraoImages").style.display = "none";
            document.getElementById("infantilImages").style.display = "inline";
            document.getElementById("imageInput").style.display = "none";
            document.getElementById("startButton").style.display = "inline";
            break;
        case 'upload':
            using_camera = false;
            using_image = true;
            document.getElementById("padraoImages").style.display = "none";
            document.getElementById("infantilImages").style.display = "none";
            document.getElementById("imageInput").style.display = "inline";
            document.getElementById("startButton").style.display = "inline";
            break;
        case 'webcam':
            using_image = false;
            using_camera = true;
            document.getElementById("padraoImages").style.display = "none";
            document.getElementById("infantilImages").style.display = "none";
            document.getElementById("imageInput").style.display = "none";
            document.getElementById("startButton").style.display = "inline";
            break;
        case 'endscreen':
            const time = END_TIME - START_TIME;
            document.getElementById("scoreValue").innerHTML = "Score: " + time;
            document.getElementById("endScreen").style.display = "block";
            break;
    }
}

// ------------------------------------------------------- DIFFICULTY SETTER:
// called in html's <select> dropdown menu
function setDifficulty(){
    let diff = document.getElementById("difficulty").value;
    // difficulty set by number of pieces
    switch(diff){
        case "nine":
            initializePieces(3, 3);  // 9
            break;
        case "sixteen":
            initializePieces(4, 4);  // 16
            break;
        case "twofive":
            initializePieces(5, 5);  // 25
            break;
        case "threesix":
            initializePieces(6, 6);  // 36
            break;
        case "hundred":
            initializePieces(10, 10);  // 100
            break;
        case "thousand":
            initializePieces(40, 25);  // 1000 pieces
            break;
        case 'default':
            alert("escolha o número de peças!")
    }
}

//------------------------------------------------------ INITIATE PUZZLE IMAGE:
//using an uploaded image (FILE)
function useUploadImage(){
    let imgInput = document.getElementById('imageInput');
    imgInput.addEventListener('change', function(e) {
        if(e.target.files) {

            let imageFile = e.target.files[0]; //here we get the image file
            var reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = function (e) {
                
                PUZZLE_IMG = new Image(); // Creates image object
                PUZZLE_IMG.src = e.target.result; // Assigns converted image to image object
                PUZZLE_IMG.onload = function(ev) {
                    CANVAS.width = PUZZLE_IMG.width; // Assigns image's width to canvas
                    CANVAS.height = PUZZLE_IMG.height; // Assigns image's height to canvas
                    handleResize("image");
                    //listen to resize events
                    window.addEventListener('resize', handleResize);
                    initializePieces(SIZE.rows, SIZE.columns);
                    updateGame();
                }
            }
        }
    }); 
}

//using builtin images (URL)
function useBuiltInImage(category){
    //set category
    let image_option;
    switch(category){
        case 'padrao':
            image_option = document.getElementById('padraoImages');
            break;
        case 'infantil':
            image_option = document.getElementById('infantilImages');
            break;
    }
    let image_base_url = new URL(IMAGES_FOLDER_URL);
    //get file
    image_option.addEventListener('click', function(e) {
        let imageFile = new URL(image_option.value, image_base_url);
        PUZZLE_IMG = new Image(); // Creates image object
        PUZZLE_IMG.src = imageFile; // Assigns converted image to image object
        //load file
        PUZZLE_IMG.onload = function(ev) {
            CANVAS.width = PUZZLE_IMG.width; // Assigns image's width to canvas
            CANVAS.height = PUZZLE_IMG.height; // Assigns image's height to canvas
            handleResize("image");
            //listen to resize events
            window.addEventListener('resize', handleResize);
            initializePieces(SIZE.rows, SIZE.columns);
            updateGame();
        }    
    }); 
}

// using the webcam (DEVICE)
function useCamera(){
    //acess the camera thru media devices
    let promise = navigator.mediaDevices.getUserMedia({video:true});
    //this will prompt the user to acess the camera, so after that:
    promise.then(function(signal){
        //create element
        PUZZLE_IMG = document.createElement("video");
        PUZZLE_IMG.srcObject = signal;
        //play
        PUZZLE_IMG.play();
        //when video starts playing we update it in the canvas:
        PUZZLE_IMG.onloadeddata = function(){
            //when metadata about he video is available we resize
            handleResize("camera");
            //listen to resize events
            window.addEventListener('resize', handleResize);
            initializePieces(SIZE.rows, SIZE.columns);
            updateGame();
        }
    //error handling for camera input
    }).catch(function(err){
        alert("Camera error: " + err);
    });
}
// ------------------------------------------------------------ RESIZE HANDLER:
function handleResize(string){
    // fill the windows with the canvas
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    if(string == "camera"){
        let resizer = SCALER * Math.min(
                window.innerWidth / PUZZLE_IMG.videoWidth,
                window.innerHeight / PUZZLE_IMG.videoHeight
                );
        // set size acordingly preserving aspect ratio
        SIZE.width = resizer * PUZZLE_IMG.videoWidth;
        SIZE.height = resizer * PUZZLE_IMG.videoHeight;
    }

    if(string == "image"){
        let resizer = SCALER * Math.min(
            window.innerWidth / PUZZLE_IMG.width,
            window.innerHeight / PUZZLE_IMG.height
            );
        // set size acordingly preserving aspect ratio
        SIZE.width = resizer * PUZZLE_IMG.width;
        SIZE.height = resizer * PUZZLE_IMG.height;
    }
    // half width/height towards left and top
    SIZE.x = window.innerWidth / 2 - SIZE.width / 2;
    SIZE.y = window.innerHeight / 2 - SIZE.height / 2;
}

// ------------------------------------------------------- INITIALIZE PIECES:
// takes "difficulty" args to set rows and cols
function initializePieces(rows, cols){
    SIZE.rows = rows;
    SIZE.columns = cols;

    PIECES = [];
    for(let i = 0; i < SIZE.rows; i++){
        for(let j = 0; j < SIZE.columns; j++){
            PIECES.push(new Piece(i,j));
        }
    }

    // add the tabs (puzzle fittings)
    let count = 0;

    for(let i = 0; i < SIZE.rows; i++){
        for(let j = 0; j < SIZE.columns; j++){

            const piece = PIECES[count];

            //if on last row, theres no bottom tabs
            if( i == SIZE.rows - 1 ){ piece.bottom = null; }
            else {
                const sgn = (Math.random() - 0.5) < 0?-1:1;  //random 1 or -1
                piece.bottom = sgn * (Math.random() * 0.4 + 0.3);
            }

            //if on last column, theres no right tabs
            if( j == SIZE.columns - 1 ){ piece.right = null; }
            else {
                const sgn = (Math.random() - 0.5) < 0?-1:1;
                piece.right = sgn * (Math.random() * 0.4 + 0.3);
            }

            //if on first column, theres no left tabs
            if( j == 0 ){ piece.left = null; }
            else { piece.left = -PIECES[count - 1].right; }

            //if on first row, theres no top tabs
            if( i == 0 ){ piece.top = null; }
            else { piece.top = -PIECES[count - SIZE.columns].bottom; }
            
            count++;
        }
    }
}

// ------------------------------------------------------------ RANDOMIZE PIECES:
function randomizePieces(){
    for(let i = 0; i < PIECES.length; i++){
        let loc = {
            // random location based on screen w/h and piece size so pieces dont go off screen
            x: Math.random() * (CANVAS.width - PIECES[i].width),
            y: Math.random() * (CANVAS.height - PIECES[i].height)
        }
        PIECES[i].x = loc.x;
        PIECES[i].y = loc.y;
        PIECES[i].correct = false;  //set "piece is in correct location" to false
    }
}

// --------------------------------------------------------- START/RESTART:
// start/restart the game html <button>
function restart(){
    if(PUZZLE_IMG != null){
        //get current time
        START_TIME = (new Date()).getTime();
        //reset end time
        END_TIME = null;
        randomizePieces();

        //hide the main menu
        document.getElementById("menuItems").style.display = "none";
        //play melody
        playStartMelody();

    } else {
        alert("Please choose an image!");
    }
}

// -------------------------------------------------------- WIN CONDITION:
// check win condition/
function isComplete(){
    //checks if ALL pieces have the "correct" arg set to true
    for(let i = 0; i < PIECES.length; i++){
        if(PIECES[i].correct == false){
            return false;
        }
    }
    return true;
}

// ------------------------------------------------------- EVENT LISTENERS:
// mouse and touch event listeners
function addEventListeners(){
    // mouse
    CANVAS.addEventListener("mousedown", onMouseDown);
    CANVAS.addEventListener("mousemove", onMouseMove);
    CANVAS.addEventListener("mouseup", onMouseUp);
    // touch
    CANVAS.addEventListener("touchstart", onTouchStart);
    CANVAS.addEventListener("touchmove", onTouchMove);
    CANVAS.addEventListener("touchend", onTouchEnd);
    // menu buttons
    MENU_BTN.addEventListener('click', restart);
    END_BTN.addEventListener('click', function(){ setMenuDisplay('menu') }, false);
    DIFF_BTN.addEventListener('change', setDifficulty);
    IMG_BTN.addEventListener('change', setImageSource);
}

// --------------------------------------------------------- TOUCH EVENTS:
//press
function onTouchStart(evt){
    let loc = {x:evt.touches[0].clientX,
        y:evt.touches[0].clientY};
    onMouseDown(loc);
}
//drag
function onTouchMove(evt){
    let loc = {x:evt.touches[0].clientX,
        y:evt.touches[0].clientY};
    onMouseMove(loc);
}
//release
function onTouchEnd(){
    onMouseUp();
}

// ---------------------------------------------------------- MOUSE EVENTS:
//click
function onMouseDown(evt){
    SELECTED_PIECE = getPressedPiece(evt);
    //if a piece is actually selected
    if(SELECTED_PIECE != null && SELECTED_PIECE.correct == false){
        // make sure selected pieces can go over others
        const index = PIECES.indexOf(SELECTED_PIECE);

        // error check in case a piece doesnt exist
        if(index > -1){
            PIECES.splice(index, 1);
            PIECES.push(SELECTED_PIECE);
        }

        SELECTED_PIECE.offset = {
            x: evt.x - SELECTED_PIECE.x,
            y: evt.y - SELECTED_PIECE.y
        }

        SELECTED_PIECE.correct = false;
    }
}
//drag
function onMouseMove(evt){
    if(SELECTED_PIECE != null && SELECTED_PIECE.correct == false){
        SELECTED_PIECE.x = evt.x - SELECTED_PIECE.offset.x;
        SELECTED_PIECE.y = evt.y - SELECTED_PIECE.offset.y;
    }
}
//release
function onMouseUp(){
    if(SELECTED_PIECE && SELECTED_PIECE.isClose()){
        SELECTED_PIECE.snap();
        // check win condition
        if(isComplete() && END_TIME == null){  // <----- WIN CONDITION FULFILLED

            let now = (new Date()).getTime();
            END_TIME = now;
            setTimeout(playWinMelody, 500);
            //show end-screen
            setMenuDisplay('endscreen');
        }
    }
    SELECTED_PIECE = null;
}


// ------------------------------------------------------------ PRESSED PIECE:
function getPressedPiece(loc){
    for(let i = PIECES.length - 1; i >= 0; i--){
        // if click is within piece boundries
        if(loc.x > PIECES[i].x && loc.x < PIECES[i].x + PIECES[i].width &&
            loc.y > PIECES[i].y && loc.y < PIECES[i].y + PIECES[i].height){
                return PIECES[i];
            }
    }
    // if click-point is not in card area:
    return null;
}

// -------------------------------------------------------- UPDATE GAME (MAIN UPDATE):
function updateGame(){

    //clear the canvas before pieces are drawn
    CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);

    //make canvas semi visible (Easy mode - debug mode)
    CONTEXT.globalAlpha = 0.05;
    //update the image
    CONTEXT.drawImage(PUZZLE_IMG,
        SIZE.x, SIZE.y,
        SIZE.width, SIZE.height);

    //reset transparency so only video has it, not pieces
    CONTEXT.globalAlpha = 1;
    
    //draw the pieces
    for(let i = 0; i < PIECES.length; i++){
        PIECES[i].draw(CONTEXT);
    }

    updateTime();
    //call the function recursevely many times to update video camera live
    window.requestAnimationFrame(updateGame);  //60fps if the user pc can handle
}

// ------------------------------------------------------------ PIECE CLASS:
class Piece{
    constructor(rowIndex, colIndex){
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;

        //each piece is sized by the number of "squares" on grid
        this.width = SIZE.width / SIZE.columns;
        this.height = SIZE.height / SIZE.rows;
        //each piece is at correct location at first:
        this.x = SIZE.x + this.width * this.colIndex;
        this.y = SIZE.y + this.height * this.rowIndex;

        //correct location of pieces:
        this.xCorrect = this.x; 
        this.yCorrect = this.y;
        //tell if piece is in correct location
        this.correct = true;
    }

    // draw the pieces (grid) to "cut" the input (Video)
    draw(context){
        context.beginPath();
        //configure tab format (blob out/in pieces)
        const sz = Math.min(this.width, this.height);
        const neck = 0.05 * sz;   //neck width
        const tabWidth = 0.3 * sz;  //tab width
        const tabHeight = 0.3 * sz;

        //from top left
        context.moveTo(this.x, this.y);

        // make the tabs on the pieces, so it looks like a jigsaw ----------------------- start:
        //to top right
        if(this.top){
            context.lineTo(this.x + this.width * Math.abs(this.top) - neck, this.y);
            // for round tabs:
            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.top) - neck,
                this.y - tabHeight * Math.sign(this.top) * 0.2,

                this.x + this.width * Math.abs(this.top) - tabWidth,
                this.y - tabHeight * Math.sign(this.top),

                this.x + this.width * Math.abs(this.top),
                this.y - tabHeight * Math.sign(this.top)
            );
            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.top) + tabWidth,
                this.y - tabHeight * Math.sign(this.top),

                this.x + this.width * Math.abs(this.top) + neck,
                this.y - tabHeight * Math.sign(this.top) * 0.2,

                this.x + this.width * Math.abs(this.top) + neck,
                this.y
            );
            // for triangle tabs:
            // context.lineTo(this.x + this.width * Math.abs(this.top), this.y - tabHeight * Math.sign(this.top));
            // context.lineTo(this.x + this.width * Math.abs(this.top) + neck, this.y);
        }
        context.lineTo(this.x + this.width, this.y);

        //to bottom right
        if(this.right){
            context.lineTo(this.x + this.width, this.y + this.height * Math.abs(this.right) - neck);
            // for round tabs:
            context.bezierCurveTo(
                this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
                this.y + this.height * Math.abs(this.right) - neck,

                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right) - tabWidth,

                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right)
            );
            context.bezierCurveTo(
                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right) + tabWidth,

                this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
                this.y + this.height * Math.abs(this.right) + neck,

                this.x + this.width,
                this.y + this.height * Math.abs(this.right) + neck
            );
            // for triangle tabs:
            // context.lineTo(this.x + this.width - tabHeight * Math.sign(this.right), this.y + this.height * Math.abs(this.right));
            // context.lineTo(this.x + this.width, this.y + this.height * Math.abs(this.right) + neck);
        }
        context.lineTo(this.x + this.width, this.y + this.height);

        //to bottom left
        if(this.bottom){
            context.lineTo(this.x + this.width * Math.abs(this.bottom) + neck, this.y + this.height);
            // for round tabs:
            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.bottom) + neck,
                this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

                this.x + this.width * Math.abs(this.bottom) + tabWidth,
                this.y + this.height + tabHeight * Math.sign(this.bottom),

                this.x + this.width * Math.abs(this.bottom),
                this.y + this.height + tabHeight * Math.sign(this.bottom)
            );
            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.bottom) - tabWidth,
                this.y + this.height + tabHeight * Math.sign(this.bottom),

                this.x + this.width * Math.abs(this.bottom) - neck,
                this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

                this.x + this.width * Math.abs(this.bottom) - neck,
                this.y + this.height
            );
            // for triangle tabs:
            // context.lineTo(this.x + this.width * Math.abs(this.bottom), this.y + this.height + tabHeight * Math.sign(this.bottom));
            // context.lineTo(this.x + this.width * Math.abs(this.bottom) - neck, this.y + this.height);
        }
        context.lineTo(this.x, this.y + this.height)

        //to top left
        if(this.left){
            context.lineTo(this.x, this.y + this.height * Math.abs(this.left) + neck);
            // for round tabs:
            context.bezierCurveTo(
                this.x + tabHeight * Math.sign(this.left) * 0.2,
                this.y + this.height * Math.abs(this.left) + neck,

                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left) + tabWidth,

                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left)
            );
            context.bezierCurveTo(
                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left) - tabWidth,

                this.x + tabHeight * Math.sign(this.left) * 0.2,
                this.y + this.height * Math.abs(this.left) - neck,

                this.x,
                this.y + this.height * Math.abs(this.left) - neck
            );
            // for triangle tabs:
            // context.lineTo(this.x + tabHeight * Math.sign(this.left), this.y + this.height * Math.abs(this.left));
            // context.lineTo(this.x, this.y + this.height * Math.abs(this.left) - neck);
        }
        context.lineTo(this.x, this.y);
        // make the tabs on the pieces so it looks like a jigsaw ---------------------------- end.

        context.save();  //save the drawing
        context.clip();  //clip to mask


        if(using_image){
            // scale pieces so they fill the tabs that go outside the piece
            const scaledTabHeight = Math.min(PUZZLE_IMG.width / SIZE.columns,
                                                PUZZLE_IMG.height / SIZE.rows) * tabHeight / sz;

            //each piece show the part of the video it is responsible for:
            context.drawImage(PUZZLE_IMG,
                this.colIndex * PUZZLE_IMG.width / SIZE.columns - scaledTabHeight,
                this.rowIndex * PUZZLE_IMG.height / SIZE.rows - scaledTabHeight,
                PUZZLE_IMG.width / SIZE.columns + scaledTabHeight * 2,
                PUZZLE_IMG.height / SIZE.rows + scaledTabHeight * 2,
                this.x - tabHeight,
                this.y - tabHeight,
                this.width + tabHeight * 2,
                this.height + tabHeight * 2
                );

        } else if(using_camera){
            // scale pieces so they fill the tabs that go outside the piece
            const scaledTabHeight = Math.min(PUZZLE_IMG.videoWidth / SIZE.columns,
                                                PUZZLE_IMG.videoHeight / SIZE.rows) * tabHeight / sz;

            //each piece show the part of the video it is responsible for:
            context.drawImage(PUZZLE_IMG,
                this.colIndex * PUZZLE_IMG.videoWidth / SIZE.columns - scaledTabHeight,
                this.rowIndex * PUZZLE_IMG.videoHeight / SIZE.rows - scaledTabHeight,
                PUZZLE_IMG.videoWidth / SIZE.columns + scaledTabHeight * 2,
                PUZZLE_IMG.videoHeight / SIZE.rows + scaledTabHeight * 2,
                this.x - tabHeight,
                this.y - tabHeight,
                this.width + tabHeight * 2,
                this.height + tabHeight * 2
                );
        }
        context.restore();  //restore clip
        context.stroke();  //strokes or nothing is drawn
    }
    
    // calculates if piece is close enough to snap()
    isClose(){
        if(distance({x:this.x, y:this.y},
            {x:this.xCorrect, y:this.yCorrect}) < this.width / 3){  // 3 = ~33% margin of error
                return true;
            }
        return false;
    }

    // snap pieces in the correct location (if isClose())
    snap(){
        this.x = this.xCorrect;
        this.y = this.yCorrect;
        if(this.correct == false){ POP_SOUND.play();}
        //set "piece in correct place" to true
        this.correct = true;
    }
}

// ----------------------------------------------------- DISTANCE CALCULATOR:
// calculates distance from piece location 
// to correct location to see if isClose()
function distance(p1, p2){
    return Math.sqrt(
        (p1.x - p2.x) * (p1.x - p2.x) + 
        (p1.y - p2.y) * (p1.y - p2.y)
    );
}

// ------------------------------------------------------------ TIME:
// update clock (playtime)
function updateTime(){
    //get current time
    let now = (new Date()).getTime();
    if(START_TIME != null){
        if(END_TIME != null){
            document.getElementById("time").innerHTML = formatTime(END_TIME - START_TIME);
        } else {
            document.getElementById("time").innerHTML = formatTime(now - START_TIME);
        }
    }
}

// ------------------------------------------------------- TIME FORMATTER:
function formatTime(milliseconds){
    //calculate from milliseconds
    let seconds = Math.floor(milliseconds/1000);
    let s = Math.floor(seconds % 60);
    let m = Math.floor((seconds % (60 * 60)) / 60);
    let h = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
    //format like a digital clock 00:00:00
    let formattedTime = h.toString().padStart(2, '0');
    formattedTime += ":";
    formattedTime += m.toString().padStart(2, '0');
    formattedTime += ":";
    formattedTime += s.toString().padStart(2, '0');

    return formattedTime;
}

// --------------------------------------------------------SYNTHESIZED AUDIO:
// audio setup
function playNote(key, duration){
    let osc = AUDIO_CONTEXT.createOscillator();
    osc.frequency.value = key;
    osc.start(AUDIO_CONTEXT.currentTime);
    osc.stop(AUDIO_CONTEXT.currentTime + duration/1000);  //time to milliseconds
    // osc -> envelope -> destination
    let envelope = AUDIO_CONTEXT.createGain();
    osc.connect(envelope);  //connect to speakers
    osc.type = 'triangle';  // remove for smoother sound
    envelope.connect(AUDIO_CONTEXT.destination);
    //piano powerful attack
    envelope.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime);
    envelope.gain.linearRampToValueAtTime(0.5, AUDIO_CONTEXT.currentTime + 0.1);
    envelope.gain.linearRampToValueAtTime(0, AUDIO_CONTEXT.currentTime + duration / 1000);

    //unmount audio device after use
    setTimeout(function(){
        osc.disconnect();
    }, duration);
}

// melody setup
function playWinMelody(){
    playNote(keys.C4, 300);
    setTimeout(function(){
        playNote(keys.D4, 300);
    }, 300);
    setTimeout(function(){
        playNote(keys.E4, 300);
    }, 600);
}

function playStartMelody(){
    playNote(keys.C4, 300);
    setTimeout(function(){
        playNote(keys.E4, 300);
    }, 300);
    setTimeout(function(){
        playNote(keys.G4, 300);
    }, 600);
}

//Start the game
main();