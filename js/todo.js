const todo = {
  tpl: null,
  items: [], // 작업 목록
  itemsSearched: null, // 검색된 작업 목록 / 비어있는것도 검색이되는거니까 null로 바꿈

  // 초기에 실행할 영역
  init() {
    // 초기화화
    // init() : 페이지 로드 시 초기설정과 기존 데이터를 불러오는 역할 -> 로드해서 템플릿을 설정해줌
    // 템플릿 HTML 추출
    this.tpl = document.getElementById("tpl").innerHTML;

    // 저장된 작업 목록 조회 및 출력
    const data = localStorage.getItem("todos"); // localStorage에서 기존 저장된 할 일 데이터를 불러옴
    if (data) {
      this.items = JSON.parse(data); // JSON 형식으로 저장된 데이터를 배열이나 객체로 변환하는 역할
      // 이 배열을 가지고 작업관리를 할 수 있음
    }

    this.render(); // 할 일 목록을 화면에 표시
  },
  // 작업 등록
  add(title, description, deadline) {
    const seq = Date.now(); // 현재 시간을 기준으로 seq를 생성성
    this.items.push({ seq, title, description, deadline, done: false }); // 입력받은 내용을 배열에 추가

    this.save(); // 추가된 작업 저장 // localStorage에 배열 데이터를 JSON 문자열로 변환(JSON.stringify)하여 저장

    this.render(); // 화면 갱신 // this.items를 기반으로 동적으로 돔에 추가해줌
  },
  // 작업 삭제
  remove(seq) {
    // seq로 작업 목록 순서 번호(index) 조회
    const index = this.items.findIndex((item) => item.seq === seq);

    // splice로 해당 순서 번호 항목 제거
    this.items.splice(index, 1);

    this.save(); // 작업 목록 저장

    // 화면 갱신
    this.render(); // 화면 갱신 / 추가하고 나면 갱신해줘야하니까
  },
  // 작업 목록 출력, 갱신
  render() {
    const itemsEl = document.querySelector(".items");
    itemsEl.innerHTML = "";

    const domParser = new DOMParser();

    const items = this.itemsSearched ? this.itemsSearched : this.items;
    // 검색해서 있으면 itemsSearched여기로 결과가 items로 넘어가는거 // 원본데이터를 바꾸면 안되니까

    for (const { seq, title, description, deadline, done } of items) {
      let html = this.tpl;
      const checkedTrue = done ? " checked" : "";
      const checkedFalse = done ? "" : " checked";

      html = html
        .replace(/#{seq}/g, seq) // 정형표현식? g는 전체
        .replace(/#{title}/g, title)
        .replace(/#{description}/g, description.replace(/\n/g, "<br>")) // 줄개행문자 br태그로 변경시켰음
        .replace(/#{deadline}/g, deadline)
        .replace(/#{checkedTrue}/g, checkedTrue)
        .replace(/#{checkedFalse}/g, checkedFalse)
        .replace(/#{addClass}/g, done ? " done" : "");

      const dom = domParser.parseFromString(html, "text/html");
      const itemEl = dom.querySelector("li");
      itemsEl.append(itemEl);

      const titWrapEl = itemEl.querySelector(".tit-wrap");
      titWrapEl.addEventListener("click", function () {
        todo.accodianView(this.parentElement);
      });

      // 삭제 처리
      const removeEl = itemEl.querySelector(".remove");
      removeEl.addEventListener("click", function () {
        if (confirm("정말 삭제하겠습니까?")) {
          todo.remove(seq);
        }
      });

      // 작업 완료, 작업중 처리
      const doneEls = document.getElementsByName(`done_${seq}`);
      const itemIndex = this.items.findIndex((item) => item.seq === seq); // 값이 넘어오면 index번호로 확인
      for (const el of doneEls) {
        el.addEventListener("click", function () {
          // 라디오 버튼 클릭 이벤트로 done 값을 변경
          const done = this.value === "true"; // 체크했을 때 아이템쪽에 false일때 done 클래스를 추가해야하므로
          todo.items[itemIndex].done = done;
          todo.render();
          todo.save(); // 불러온뒤에 저장을 해야지 안그러면 seq 를 넣었을 때 새로고침하면 데이터가 날아감
        });
      }
    }
  },
  accodianView(el) {
    // 아코디언 효과 .on 클래스제거 -> 선택한 항목에 .on클래스 추가 -> 내용나오게
    const items = document.querySelectorAll(".items > .item");
    items.forEach((item) => item.classList.remove("on"));

    el.classList.add("on");
  },
  /**
   * items(할일 목록)를 JSON 문자열로 변환 후 localStorage로 저장
   */
  save() {
    const data = JSON.stringify(this.items);
    localStorage.setItem("todos", data);
    this.itemsSearched = null; // 검색에 대한 초기화
    frmSearch.skey.value = "";
  },
  // 정렬
  sort(field, order) {
    this.items.sort((item1, item2) => {
      switch (field) {
        case "deadline":
          let gap = new Date(item2.deadline) - new Date(item1.deadline);
          return order === "desc" ? gap : -gap;
        default:
          return order == "desc"
            ? item2.seq - item1.seq
            : item1.seq - item2.seq;
      }
    });

    this.render();
  },
};

window.addEventListener("DOMContentLoaded", function () {
  // 초기화
  todo.init();

  // 양식 태그의 기본 동작 차단
  frmTodo.addEventListener("submit", function (e) {
    e.preventDefault();

    /**
     * 0. 검증 실패 메세지 출력화면 초기화
     * 1. 필수 항목 검증
     * 2. 일정 추가
     * 3. 양식 초기화
     */
    try {
      // 0. 검증 실패 메세지 출력화면 초기화
      const errors = document.getElementsByClassName("error");
      for (const el of errors) {
        el.innerText = "";
        if (!el.classList.contains("dn")) {
          el.classList.add("dn");
        }
      }

      const formData = {};

      // 1. 유효성 검사 S
      const requiredFields = {
        title: "작업 제목을 입력하세요.",
        deadline: "마감일을 입력하세요.",
        description: "작업 내용을 입력하세요.",
      };

      for (const [field, message] of Object.entries(requiredFields)) {
        const value = frmTodo[field].value.trim();
        if (!value) {
          throw new Error(JSON.stringify({ field, message }));
        }

        // 마감일인 경우 현재 날짜보다 이전은 될 수 없음
        if (field === "deadline" && new Date(value) - new Date() < 0) {
          throw new Error(
            JSON.stringify({ field, message: "현재 날짜 이후로 입력하세요." })
          );
        }

        // 입력 데이터 추가
        formData[field] = value;
      }

      // 1. 유효성 검사 E

      // 2. 작업 등록
      const { title, deadline, description } = formData;
      todo.add(title, description, deadline);

      // 3. 양식 초기화
      frmTodo.title.value = "";
      frmTodo.deadline.value = "";
      frmTodo.description.value = "";

      frmTodo.title.focus();
    } catch (err) {
      const { field, message } = JSON.parse(err.message);
      const el = document.getElementById(`error-${field}`);

      if (el) {
        el.innerText = message;
        el.classList.remove("dn");
        el.focus();
      }
    }
  });

  // 작업 목록 정렬 처리 S
  frmSearch.sort.addEventListener("change", function () {
    const [field, order] = this.value.split("_");
    todo.sort(field, order);
  });
  // 작업 목록 정렬 처리 E

  // 키워드 검색 처리 S
  frmSearch.skey.addEventListener("change", function () {
    const skey = this.value.trim();
    todo.itemsSearched = skey
      ? todo.items.filter(
          // 필터는 새로운 배열객체를 만들려고
          ({ title, description }) =>
            title.includes(skey) || description.includes(skey)
        )
      : null; // 검색어가 없을때는 원래 형태로 나오게 널값넣었음

    todo.render();
  });
  // 키워드 검색 처리 E
});
