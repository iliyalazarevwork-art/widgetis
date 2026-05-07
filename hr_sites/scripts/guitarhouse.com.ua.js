// source: https://guitarhouse.com.ua/
// extracted: 2026-05-07T21:18:55.220Z
// scripts: 1

// === script #1 (length=3425) ===
-->
<!--    var player;-->
<!--    function onYouTubeIframeAPIReady() {-->
<!--        player = new YT.Player('muteYouTubeVideoPlayer', {-->
<!--            videoId: 'jslAQDadZOs', // YouTube Video ID-->
<!--            width:  (window.innerWidth < 450)?300:350 ,               // Player width (in px)-->
<!--            height:  (window.innerWidth < 450)?'auto':180,              // Player height (in px)-->
<!---->
<!--            playerVars: {-->
<!--                autoplay: 1,        // Auto-play the video on load-->
<!--                controls: 1,        // Show pause/play buttons in player-->
<!--                start: 17,-->
<!--                showinfo: 0,        // Hide the video title-->
<!--                modestbranding: 1,  // Hide the Youtube Logo-->
<!--                loop: 1,            // Run the video in a loop-->
<!--                fs: 1,              // Hide the full screen button-->
<!--                cc_load_policy: 1, // Hide closed captions-->
<!--                iv_load_policy: 3,  // Hide the Video Annotations-->
<!--                autohide: 0         // Hide video controls when playing-->
<!--            },-->
<!--            events: {-->
<!--                onReady: function(e) {-->
<!--                    e.target.mute();-->
<!--                }-->
<!--            }-->
<!--        });-->
<!--    }-->
<!---->
<!--    document.addEventListener('DOMContentLoaded',function (){-->
<!--        const videoBlock = document.createElement('div');-->
<!--        videoBlock.id='youtube-video-block';-->
<!--        const playerBlock = document.createElement('div');-->
<!--        const closeBtn = document.createElement('span')-->
<!--        closeBtn.classList.add('close-video-btn');-->
<!--        playerBlock.id='muteYouTubeVideoPlayer';-->
<!--        videoBlock.appendChild(closeBtn)-->
<!--        videoBlock.appendChild(playerBlock)-->
<!--        videoBlock.classList.add('video-youtube');-->
<!--        const  siteText= document.createElement('div')-->
<!--        siteText.innerHTML = 'Що пропонує покупцям Гітарний Дім';-->
<!--        siteText.classList.add('site-text');-->
<!--//    videoBlock.appendChild(siteText)-->
<!---->
<!---->
<!--        const url = location.href-->
<!--        const Pages= ['https://guitarhouse.com.ua/',-->
<!--            'https://guitarhouse.com.ua/akustichni-gitari/',-->
<!--            'https://guitarhouse.com.ua/elektro-akustichni-gitari/',-->
<!--            'https://guitarhouse.com.ua/klasichni-gitari/',-->
<!--            'https://guitarhouse.com.ua/elektrogitari/',-->
<!--            'https://guitarhouse.com.ua/bas-gitari/',-->
<!--            'https://guitarhouse.com.ua/struni/',-->
<!--            'https://guitarhouse.com.ua/pidsiluvachi/',-->
<!--            'https://guitarhouse.com.ua/ukulele/'];-->
<!--        const isPage = Pages.indexOf(url) != -1;-->
<!--        const isHomePage =  location.href =='https://guitarhouse.com.ua/'-->
<!---->
<!--        if (isPage || isHomePage ){-->
<!---->
<!--            const pageBlock = document.querySelector('body').appendChild(videoBlock);-->
<!--            closeBtn.addEventListener('click',()=>{-->
<!--                document.getElementById('youtube-video-block').remove()-->
<!--            })-->
<!--            setTimeout(onYouTubeIframeAPIReady,1000);-->
<!--        }-->
<!--    });-->
<!--
