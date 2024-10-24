// API 호출에 필요한 것
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3NzE4YjdjZDA1ZjMwNWU5Y2NiNjg5MzVlYzFiNTI1MSIsIm5iZiI6MTcyOTIxNzA4My43MDAyMzEsInN1YiI6IjY3MTFjMDUzMjVjNzBiOGIxZDY3OGY3OCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.eH5xHFutttXQKPDQOqebNUEqZqiFTJMRRIpDQcA6Mwc'
    }
};

let bookmarks = [];

// DOMContentLoaded 이벤트 리스너 설정
document.addEventListener("DOMContentLoaded", function() {
    loadBookmarks(); // 북마크
    createModal(); // 모달 생성
    fetchMovies(); 
    setupSearch(); 
    topRatedMovies(); // Top Rated 영화 슬라이드

    //북마크 보기, 추가, 삭제, 홈버튼
    document.getElementById('showBookmarksBtn').addEventListener('click', showBookmarks);
    document.getElementById('homeBtn').addEventListener('click', () => {
        fetchMovies(); 
    });
    document.getElementById('bookmarkBtn').addEventListener('click', addBookmark);
    document.getElementById('removeBookmarkBtn').addEventListener('click', removeBookmark);
});


// 인기 영화 또는 검색된 영화 가져오기
function fetchMovies(query = '') {
    const searchURL = query
        ? `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`
        : 'https://api.themoviedb.org/3/movie/popular?language=en-US&page=1';

    fetch(searchURL, options)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                displayMovies(data.results);
                localStorage.setItem('movies', JSON.stringify(data.results));
            } else {
                document.getElementById('movieList').innerHTML = '<p>영화를 찾을 수 없습니다.</p>';
            }
        })
        .catch(err => console.error(err));
}

// Top Rated 슬라이드 설정
function topRatedMovies() {
    fetch('https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1', options)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                displayTopRatedMovies(data.results.slice(0, 10));
            }
        })
        .catch(err => console.error(err));
}

// 슬라이드에 영화 표시
function displayTopRatedMovies(movies) {
    const slidesContainer = document.querySelector('.slides');
    slidesContainer.innerHTML = '';

    movies.forEach((movie, index) => {
        const slide = document.createElement('div');
        slide.classList.add('slide');
        slide.innerHTML = `
            <img class="slide-img" data-movie-id="${movie.id}" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
            <div class="slide-info">
                <h3>${index + 1}. ${movie.title}</h3>
                <p>평점: ${movie.vote_average}</p>
            </div>`;
        slidesContainer.appendChild(slide);


        slide.querySelector('.slide-img').addEventListener('click', (event) => {

        showMovieModal(movieId); // 모달을 여는 함수
        });
    });
    setupSlide(movies.length);
};




// 슬라이드 화살표 설정
function setupSlide(totalSlides) {
    let currentIndex = 0;
    const slidesContainer = document.querySelector('.slides');
    const prevButton = document.getElementById('prevSlide');
    const nextButton = document.getElementById('nextSlide');

    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateSlide();
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateSlide();
    });

    // setTimeout 기반 자동 슬라이드
    startAutoSlide();

    slidesContainer.addEventListener('mouseover', () => clearTimeout(autoSlideTimeout)); 
    slidesContainer.addEventListener('mouseout', () => startAutoSlide()); 

    function updateSlide() {
        slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    function startAutoSlide() {
        autoSlideTimeout = setTimeout(function autoSlide() {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateSlide();
            startAutoSlide();
        }, 5000);
    }
}

// 모달 생성
function createModal() {
    const modalHTML = `
        <div id="movieModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <img id="modalImage" src="" alt="">
                <h2 id="modalTitle"></h2>
                <p id="modalOverview"></p>
                <p><strong>개봉일:</strong> <span id="modalReleaseDate"></span></p>
                <p><strong>평점:</strong> <span id="modalRating"></span></p>
                <button id="bookmarkBtn">북마크 추가</button>
                <button id="removeBookmarkBtn">북마크 취소</button>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

//모달의 영화 ID를 가져와서 북마크에 추가, 삭제
function handleAddBookmark() { 
    const movieId = document.getElementById("movieModal").dataset.id;
    addBookmark(parseInt(movieId));
} 

function handleRemoveBookmark() { 
    const movieId = document.getElementById("movieModal").dataset.id;
    removeBookmark(parseInt(movieId)); 
} 

// 모달 콘텐츠 업데이트
function updateModalContent(movie) {
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    const removeBookmarkBtn = document.getElementById('removeBookmarkBtn');

    bookmarkBtn.onclick = () => addBookmark(movie.id); 
    removeBookmarkBtn.onclick = () => removeBookmark(movie.id); 

    document.getElementById("modalTitle").textContent = movie.title;
    document.getElementById("modalOverview").textContent = movie.overview || '개요 정보가 없습니다.';
    document.getElementById("modalImage").src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    document.getElementById("modalReleaseDate").textContent = movie.release_date || '정보 없음';
    document.getElementById("modalRating").textContent = movie.vote_average || '정보 없음';
    document.getElementById("movieModal").dataset.id = movie.id;

    document.getElementById("movieModal").style.display = "block";
}


// 상세보기 버튼을 눌렀을때 모달에 표시
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('addBookmarkBtn')) {
        const movieCard = e.target.closest('.movie-card');
        const movieId = movieCard.getAttribute('id');
        const movieData = findMovieDataById(movieId);
        if (movieData) updateModalContent(movieData);
    }
});

// 모달 닫기
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('close') || event.target.id === "movieModal") {
        document.getElementById("movieModal").style.display = "none";
    }
});

// 영화 카드 리스트 표시
function displayMovies(movies) {
    const movieList = document.getElementById('movieList');
    movieList.innerHTML = ''; 
    movies.forEach(movie => {
        const movieCard = `
        <div class="movie-card" id="${movie.id}">
            <img class="movie-img" src="https://image.tmdb.org/t/p/w500/${movie.poster_path}" alt="${movie.title}" />
            <h2>${movie.title}</h2>
            <button class="addBookmarkBtn" onclick="showMovieModal(${movie.id})">상세보기</button>
        </div>`;
        movieList.innerHTML += movieCard;
    });
}

// 영화 모달을 보여주는 함수
function showMovieModal(movieId) {
    const movieData = findMovieDataById(movieId);
    if (movieData) {
        updateModalContent(movieData);
    }
}

// 북마크를 로컬 스토리지에서 불러오고
function loadBookmarks() {
    const storedBookmarks = localStorage.getItem('bookmarks');
    bookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];
}

// 북마크를 로컬 스토리지에 저장
function saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}


// 북마크 추가 함수
function addBookmark(movieId) {
    const movieData = findMovieDataById(movieId);
    if (movieData && !bookmarks.some(bookmark => bookmark.id === movieId)) {
        bookmarks.push(movieData);
        saveBookmarks();
        alert(`${movieData.title}을(를) 북마크에 추가했습니다.`);
    }
}

//북마크 보기 함수 추가
function showBookmarks() {
    const movieList = document.getElementById('movieList');
    movieList.innerHTML = '';

    if (bookmarks.length === 0) {
        movieList.innerHTML = '<p>북마크된 영화가 없습니다.</p>';
        return;
    }

    bookmarks.forEach(movie => {
        const movieCard = `
        <div class="movie-card" id="${movie.id}">
            <img class="movie-img" src="https://image.tmdb.org/t/p/w500/${movie.poster_path}" alt="${movie.title}" />
            <h2>${movie.title}</h2>
            <button class="addBookmarkBtn">상세보기</button>
        </div>`;
        movieList.innerHTML += movieCard;
    });

    document.querySelectorAll('.addBookmarkBtn').forEach(button => {
        button.addEventListener('click', (event) => {
            const movieCard = event.target.closest('.movie-card');
            const movieId = movieCard.getAttribute('id');
            showMovieModal(movieId); // 기존에 있는 함수 사용함
        });
    });
}

// 북마크 취소 함수
function removeBookmark(movieId) {
    movieId = parseInt(movieId);
    const movie = bookmarks.find(bookmark => bookmark.id === movieId); 
    if (movie) {
        bookmarks = bookmarks.filter(bookmark => bookmark.id !== movieId);
        saveBookmarks();
        alert(`${movie.title}을(를) 북마크에서 삭제했습니다.`);
        showBookmarks();
    } else {
        alert('영화를 찾을 수 없습니다.');
    }
}

// ID로 영화 찾기 함수 **추가**
function findMovieDataById(id) {
    const movies = JSON.parse(localStorage.getItem('movies'));
    return movies ? movies.find(movie => movie.id === parseInt(id)) : null;
}

// 검색 이벤트 설정
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function(event) {
        const query = event.target.value.trim();
        fetchMovies(query);
    });
}
