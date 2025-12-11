import { h, Fragment, mount } from './jsx-dom';
import './styles/tailwind.css';

(function () {
  'use strict';

  console.log('[TinyGrail Exchange Plugin] 已运行');

  const btn = (
    <button
      className="fixed right-5 bottom-8 z-[99999] px-4 py-2 bg-sky-500 text-white rounded shadow hover:bg-sky-600 cursor-pointer"
      onClick={() => {
        alert('[TinyGrail Exchange Plugin] 已运行');
      }}
    >
      TinyGrail Exchange Plugin
    </button>
  );

  mount(btn, document.body);
})();
