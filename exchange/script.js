// ==UserScript==
// @include    */character/*
// @include    */rakuen/topiclist*
// @include    */rakuen/topic/crt/*
// @include    */rakuen/home*
// @include    */user/*
// ==/UserScript==

var cid;
var path;
var api = 'https://tinygrail.com/api/';
var cdn = 'https://tinygrail.mange.cn';
//var api = 'https://localhost:5001/api/';
var lastEven = false;

var _chartData;
var bgColor = '#fff';
var upColor = '#ffa7cc';
var downColor = '#a7e3ff';
var ma5Color = '#40f343';
var ma10Color = '#FF9800';
var ma20Color = '#ffdc51';
var ma30Color = '#d2d2d2';
var splitLineColor = '#999';
var fontColor = '#999';
var chartStart = 50;
var chartEnd = 100;

function loadGrailBox(id, callback) {
  $('#grailBox').remove();
  var name = getCharacterName();

  if (path.startsWith('/character/')) {
    $('#columnCrtB>.clearit').after(`<div id="grailBox" class="chara${id}"><div class="loading"></div></div>`);
  } else {
    if ($('#tradeDialog').length > 0)
      $('#tradeDialog').append(`<div id="grailBox" class="chara${id}"><div class="loading"></div></div>`);
    else
      $("#subject_info .board").after(`<div id="grailBox" class="chara${id}"><div class="loading"></div></div>`);
  }

  var url = api + `chara/${id}`;
  $.get(url, function (d, s) {
    if (d && d.State === 0) {
      if (d.Value.Current) {
        var flu = '0.00';
        var fclass = 'even';
        if (d.Value.Fluctuation > 0) {
          flu = `+${formatNumber(d.Value.Fluctuation * 100, 2)}%`;
          fclass = 'raise';
        } else if (d.Value.Fluctuation < 0) {
          flu = `${formatNumber(d.Value.Fluctuation * 100, 2)}%`;
          fclass = 'fall';
        }
        var grail = `<div class="trade"><div class="value" title="现价 / 市值 / 流通">#${id} -「${name}」₵${formatNumber(d.Value.Current, 2)} / ₵${formatNumber(d.Value.MarketValue, 0)} / ${formatNumber(d.Value.Total, 0)}<div class="tag ${fclass}">${flu}</div></div><button id="tradeButton" class="rounded active">开启交易</button></div>`;
        $('#grailBox').html(grail);
        $('#tradeButton').on('click', function () { loadTradeBox(d.Value) });
      } else {
        loadICOBox(d.Value);
      }
    } else {
      var empty = `<div class="empty"><div class="text">“${name}”已做好准备，点击启动按钮，加入“小圣杯”的争夺！</div><button id="beginICOButton" class="rounded active">启动ICO</button></div>`;
      $('#grailBox').html(empty);
      $('#beginICOButton').on('click', function () { beginICO(id) });
    }
    if (callback) callback(d.Value);
  });
}

function loadTradeBox(chara) {
  $(`#grailBox.chara${chara.Id}`).html(`<div id="grailBox" class="chara${chara.Id}"><div class="loading"></div></div>`);
  //$('#grailBox').addClass('chara' + chara.Id);
  getData(`chara/user/${chara.Id}`, function (d, s) {
    if (d.State === 0 && d.Value) {
      var flu = '0.00';
      var fclass = 'even';
      if (chara.Fluctuation > 0) {
        flu = `+${formatNumber(chara.Fluctuation * 100, 2)}%`;
        fclass = 'raise';
      } else if (chara.Fluctuation < 0) {
        flu = `${formatNumber(chara.Fluctuation * 100, 2)}%`;
        fclass = 'fall';
      }
      var badge = renderBadge(chara, true, true, true);
      var userChara = d.Value;
      var avatar = normalizeAvatar(chara.Icon);

      var box = `<div class="title">
        <a href="/character/${chara.Id}" target="_blank"><div class="avatar" style="background-image:url(${avatar})">
        </div></a>
        <div class="info">
          <div class="text" title="现价 / 流通 / 持有 / 资产">
            <div class="name"><a href="/character/${chara.Id}" target="_blank">#${chara.Id} -「${chara.Name}」₵${formatNumber(chara.Current, 2)} / ${formatNumber(chara.Total, 0)} / ${formatNumber(d.Value.Amount, 0)} / ${formatNumber(d.Value.Sacrifices, 0)} </a><button id="kChartButton" class="text_button">[K线图]</button></div>
            <div class="balance">账户余额：<span>₵${formatNumber(d.Value.Balance, 2)}</span></div>
          </div>
          <div class="text"><span class="tag ${fclass}">${flu}</span>${badge}</div>
        </div>
      </div>
      <div class="trade_box">
        <div class="bid">
          <div class="title"><span>价格 / 数量 / 总计</span><span class="label">买入委托</span></div>
          <ul class="bid_list list"></ul>
          <div class="trade_list">
            <div><div class="label">单价</div><input class="price" type="number" min="1" value="${Math.ceil(chara.Current)}"></input></div>
            <div><div class="label">数量</div><input class="amount" type="number" min="1" value="10"></input></div>
            <div><div class="label total">-${formatNumber(Math.ceil(chara.Current) * 10, 2)}</div><button id="bidButton" class="active bid">买入</button><button id="iceBidButton" class="ice">冰山</button></div>
          </div>
        </div>
        <div class="ask">
          <div class="title"><span>价格 / 数量 / 总计</span><span class="label">卖出委托</span></div>
          <ul class="ask_list list"></ul>
          <div class="trade_list">
            <div><div class="label">单价</div><input class="price" type="number" min="1" max="100000" value="${Math.floor(chara.Current)}"></input></div>
            <div><div class="label">数量</div><input class="amount" type="number" min="1" value="10"></input></div>
            <div><div class="label total">+${formatNumber(Math.floor(chara.Current) * 10, 2)}</div><button id="askButton" class="active ask">卖出</button><button id="iceAskButton" class="ice">冰山</button></div>
          </div>
        </div>
        <div class="depth">
          <div class="title"><span title="最新挂单 ${formatDate(chara.LastOrder)} /\n 最新成交 ${formatDate(chara.LastOrder)}">${formatTime(chara.LastOrder)} / ${formatTime(chara.LastDeal)}</span><span class="label">深度信息</span></div>
          <ul class="ask_depth"></ul>
          <ul class="bid_depth"></ul>
        </div>
        <div class="loading trade_loading" style="display:none;"></div>
      </div><div class="grail_box loading"></div>`;

      $(`#grailBox.chara${chara.Id}`).html(box);
      for (i = 0; i < d.Value.AskHistory.length; i++) {
        var ask = d.Value.AskHistory[i];
        $('.ask .ask_list').prepend(`<li title="${formatDate(ask.TradeTime)}">₵${formatNumber(ask.Price, 2)} / ${formatNumber(ask.Amount, 0)} / +${formatNumber(ask.Amount * ask.Price, 2)}<span class="cancel">[成交]</span></li>`);
      }
      for (i = 0; i < d.Value.Asks.length; i++) {
        var ask = d.Value.Asks[i];
        var ice = '';
        if (ask.Type == 1)
          ice = ' [i]';
        $('.ask .ask_list').append(`<li title="${formatDate(ask.Begin)}" class="ask">₵${formatNumber(ask.Price, 2)} / ${formatNumber(ask.Amount, 0)} / +${formatNumber(ask.Amount * ask.Price, 2)}${ice}<span class="cancel" data-id="${ask.Id}">[取消]</span></li>`);
      }
      for (i = 0; i < d.Value.BidHistory.length; i++) {
        var bid = d.Value.BidHistory[i];
        $('.bid .bid_list').prepend(`<li title="${formatDate(bid.TradeTime)}">₵${formatNumber(bid.Price, 2)} / ${formatNumber(bid.Amount, 0)} / -${formatNumber(bid.Amount * bid.Price, 2)}<span class="cancel">[成交]</span></li>`);
      }
      for (i = 0; i < d.Value.Bids.length; i++) {
        var bid = d.Value.Bids[i];
        var ice = '';
        if (bid.Type == 1)
          ice = ' [i]';
        $('.bid .bid_list').append(`<li title="${formatDate(bid.Begin)}" class="bid">₵${formatNumber(bid.Price, 2)} / ${formatNumber(bid.Amount, 0)} / -${formatNumber(bid.Amount * bid.Price, 2)}${ice}<span class="cancel" data-id="${bid.Id}">[取消]</span></li>`);
      }

      $('#bidButton').on('click', function () {
        var price = $('.bid .price').val();
        var amount = $('.bid .amount').val();
        $('.trade_list').hide();
        $('.trade_loading').show();
        postData(`chara/bid/${chara.Id}/${price}/${amount}`, null, function (d, s) {
          if (d.Message)
            alert(d.Message);
          loadGrailBox(chara.Id, loadTradeBox);
        });
      });

      $('#iceBidButton').on('click', function () {
        var price = $('.bid .price').val();
        var amount = $('.bid .amount').val();
        $('.trade_list').hide();
        $('.trade_loading').show();
        postData(`chara/bid/${chara.Id}/${price}/${amount}/true`, null, function (d, s) {
          if (d.Message)
            alert(d.Message);
          loadGrailBox(chara.Id, loadTradeBox);
        });
      });

      $('#askButton').on('click', function () {
        var price = $('.ask .price').val();
        var amount = $('.ask .amount').val();
        $('.trade_list').hide();
        $('.trade_loading').show();
        postData(`chara/ask/${chara.Id}/${price}/${amount}`, null, function (d, s) {
          if (d.Message)
            alert(d.Message);
          loadGrailBox(chara.Id, loadTradeBox);
        });
      });

      $('#iceAskButton').on('click', function () {
        var price = $('.ask .price').val();
        var amount = $('.ask .amount').val();
        $('.trade_list').hide();
        $('.trade_loading').show();
        postData(`chara/ask/${chara.Id}/${price}/${amount}/true`, null, function (d, s) {
          if (d.Message)
            alert(d.Message);
          loadGrailBox(chara.Id, loadTradeBox);
        });
      });

      $('.trade_box .bid_list .bid .cancel').on('click', function () {
        var tid = $(this).data('id');
        cancelBid(tid, function () { loadGrailBox(chara.Id, loadTradeBox) });
      });

      $('.trade_box .ask_list .ask .cancel').on('click', function () {
        var tid = $(this).data('id');
        cancelAsk(tid, function () { loadGrailBox(chara.Id, loadTradeBox) });
      });

      $('.trade_box .ask input').on('keyup', caculateTotal);
      $('.trade_box .bid input').on('keyup', caculateTotal);

      $('#kChartButton').on('click', function () {
        if (!$(this).data("loaded")) {
          $(this).data("loaded", true);
          loadChart(chara.Id, 14);
        } else {
          $(this).data("loaded", false);
          unloadChart();
        }
      });

      var box = `<div class="assets_box">
      <div class="desc link_desc">
        <div class="bold">
          <span class="link_count">LINK 0</span>
        </div>
      </div>
      <div id="lastLinks" class="assets"></div>
      <div class="desc temple_desc">
        <div class="bold">
          <span class="temple_count">固定资产 0</span>
          <span class="sub"> / +${formatNumber(chara.Rate, 2)}</span>
        </div>
        <button id="auctionHistoryButton" class="text_button">[上期公示]</button>
        <button id="buildButton" class="text_button">[资产重组]</button>
      </div>
      <div id="lastTemples" class="assets"></div>
      </div>`;

      $(`#grailBox.chara${chara.Id} .grail_box.loading`).before(box);
      $('#buildButton').on('click', () => {
        openSacrificeDialog(chara, userChara.Amount);
      });
      $('#auctionHistoryButton').on('click', () => {
        openHistoryDialog(chara);
      });

      getGameMaster((result) => {
        if (result) {
          $(`#grailBox.chara${chara.Id} .assets_box .temple_desc.desc`).append('<button id="tradeHistoryButton" class="text_button">[交易记录]</button>');
          $('#tradeHistoryButton').on('click', () => {
            openTradeHistoryDialog(chara);
          });
        }
      });

      getData(`chara/user/${chara.Id}/tinygrail/false`, (d) => {
        chara.Price = d.Value.Price;
        chara.State = d.Value.Amount;
        var button = `<button id="auctionButton" class="text_button">[萌王投票]</button>`;

        if (d.State == 0 && d.Value.Amount > 0) {
          button = `<button id="auctionButton" class="text_button">[参与竞拍]</button>`;
        }

        $(`#grailBox.chara${chara.Id} #buildButton`).before(button);
        $('#auctionButton').on('click', () => {
          openAuctionDialog(chara);
        });
      });

      loadCharacterLinks(chara, () => {
        loadBoardMember(chara.Id, 1, chara.Total, function (modifiers) {
          getData(`chara/pool/${chara.Id}`, d2 => {
            if (d2.State == 0) {
              $(`#grailBox.chara${chara.Id} .board_box .desc .bold .sub`).after(`<span title="彩票奖池" class="sub"> / ${formatNumber(d2.Value, 0)}</span>`);
            }
          });
          var power = false;
          for (i = 0; i < modifiers.length; i++) {
            if (modifiers[i].Id == d.Value.Id)
              power = true;
          }

          if (power || d.Value.Id === 702) {
            getStyle('https://cdn.bootcss.com/cropperjs/1.5.5/cropper.min.css');
            $.getScript('https://cdn.bootcss.com/cropperjs/1.5.5/cropper.min.js', function () {
              $.getScript('https://cdn.jsdelivr.net/gh/emn178/js-md5/build/md5.min.js', function () {
                $(`#grailBox.chara${chara.Id} .board_box .desc`).append('<button id="iconButton" class="text_button">[更换头像]</button>');
                $('#iconButton').on('click', function () {
                  loadIconBox(chara);
                });
              });
            });
          }
          $('.loading').hide();
        });
      });

      getData(`chara/depth/${chara.Id}`, function (d2, s2) {
        if (d2.State === 0 && d2.Value) {
          var max1 = getMaxValue(d2.Value.Asks, 'Amount');
          var max2 = getMaxValue(d2.Value.Bids, 'Amount');
          var max = max1 > max2 ? max1 : max2;

          for (i = 0; i < d2.Value.Asks.length; i++) {
            var ask = d2.Value.Asks[i];
            var p = Math.ceil(ask.Amount / max * 100);
            var type = 'normal';
            var price = formatNumber(ask.Price, 2);

            if (ask.Type == 1) {
              type = 'ice" title="冰山委托';
              price = '--';
            }

            if (ask.Amount != 0)
              $(`#grailBox.chara${chara.Id} .depth .ask_depth`).prepend(`<li class="${type}" data-price="${ask.Price}" data-amount="${ask.Amount}"><div style="width:${p}%"></div><span>₵${price} / ${formatNumber(ask.Amount, 0)}</span></li>`);
          }

          for (i = 0; i < d2.Value.Bids.length; i++) {
            var bid = d2.Value.Bids[i];
            var p = Math.ceil(bid.Amount / max * 100);
            var type = 'normal';
            var price = formatNumber(bid.Price, 2);

            if (bid.Type == 1) {
              type = 'ice" title="冰山委托';
              price = '--';
            }

            if (bid.Amount != 0)
              $(`#grailBox.chara${chara.Id} .depth .bid_depth`).append(`<li class="${type}" data-price="${bid.Price}" data-amount="${bid.Amount}"><div style="width:${p}%"></div><span>₵${price} / ${formatNumber(bid.Amount, 0)}</span></li>`);
          }

          $('.depth .ask_depth li.normal').on('click', function () {
            var price = $(this).data('price');
            var amount = $(this).data('amount');
            $('.bid .price').val(price);
            $('.bid .amount').val(amount);
            $('.bid .amount').select();
            caculateTotal();
          });

          $('.depth .bid_depth li.normal').on('click', function () {
            var price = $(this).data('price');
            var amount = $(this).data('amount');
            $('.ask .price').val(price);
            $('.ask .amount').val(amount);
            $('.ask .amount').select();
            caculateTotal();
          });
        }
      });
    } else {
      login(function () { loadTradeBox(chara) });
    }
  });
}

function loadIconBox(chara) {
  $('#grailBox .icon_box').remove();
  var box = `<div class="icon_box" style="display:none">
      <input style="display:none" id="picture" type="file" accept="image/*">
    </div>`;
  $('#grailBox').append(box);
  $("#picture").on("change", function () {
    if (this.files.length > 0) {
      var file = this.files[0];
      var url = window.URL.createObjectURL(file);
      var cropper = showCropper(url);
      $('.icon_box').append('<div class="control"><span>请珍惜主席特权，保证头像符合规范。</span><button id="uploadButton" class="active bid">确定</button><button id="cancelUploadButton">取消</button></div>');
      $('#cancelUploadButton').on('click', function () { hideCropper(cropper) });
      $('#uploadButton').on('click', function () {
        $('.icon_box').hide();
        showLoading();
        var source = cropper.getCroppedCanvas({
          fillColor: '#fff',
          maxWidth: 1000,
          maxHeight: 1000,
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high'
        });

        var image = new Image();
        image.src = source.toDataURL("image/png");
        image.onload = function () {
          var canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;

          var ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(image,
            0,//sourceX,
            0,//sourceY,
            source.width,//sourceWidth,
            source.height,//sourceHeight,
            0,//destX,
            0,//destY,
            256,//destWidth,
            256 //destHeight
          );

          var data = canvas.toDataURL('image/jpeg');
          var hash = md5(data);
          var blob = dataURLtoBlob(data);

          var url = `https://tinygrail.oss-cn-hangzhou.aliyuncs.com/avatar/${hash}.jpg`;

          getOssSignature('avatar', hash, encodeURIComponent('image/jpeg'), function (d) {
            if (d.State === 0) {
              var xhr = new XMLHttpRequest();
              xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                  if (xhr.status == 200) {
                    postData(`chara/avatar/${chara.Id}`, url, function (d) {
                      if (d.State == 0) {
                        alert("更换头像成功。");
                        hideCropper(cropper);
                      } else {
                        alert(d.Message);
                        $('.icon_box').show();
                      }
                      hideLoading();
                    });
                  } else {
                    alert('图片上传失败。');
                    $('.icon_box').show();
                    hideLoading();
                  }
                }
              };

              xhr.open('PUT', url);
              xhr.setRequestHeader('Authorization', `OSS ${d.Value.Key}:${d.Value.Sign}`);
              xhr.setRequestHeader('x-oss-date', d.Value.Date);
              xhr.send(blob);
            }
          });
        };
      });
    }
  });
  $('#picture').click();
}

function showLoading() {
  $('.loading').show();
}

function hideLoading() {
  $('.loading').hide();
}

function getOssSignature(path, hash, type, callback) {
  postData(`chara/oss/sign/${path}/${hash}/${type}`, null, function (d) {
    if (callback) callback(d);
  });
}

function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function showCropper(url) {
  $('.icon_box').show();
  $('.icon_box').append(`<img id="cropperImage" src="${url}">`);
  var cropper = new Cropper($('#cropperImage')[0], { aspectRatio: 1 });
  return cropper;
}

function hideCropper(cropper) {
  $('.icon_box').addClass('hidden');
  cropper.destroy();
  $('#cropperImage').remove();
  $('.icon_box .cropper-container').remove();
}

function getStyle(url) {
  var link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  document.getElementsByTagName("head")[0].appendChild(link);
}

function loadCharacterLinks(chara, callback) {
  getData(`chara/links/${chara.Id}`, function (d) {
    if (d.State === 0) {
      $(`#grailBox.chara${chara.Id} #lastLinks.assets`).empty();
      if (d.Value.length > 0) {
        $(`#grailBox.chara${chara.Id} .assets_box .link_count`).text(`LINK ${d.Value.length}`);
        var index = 1;
        var lastLinkId = 0;
        d.Value.forEach(l => {
          l.CharacterName = chara.Name;
          var link = renderLink(l, l.Link, true);
          if (link != null) {
            var sacrifices = Math.min(l.Assets, l.Link.Assets);
            if (l.LinkId != lastLinkId) {
              if ($(`#grailBox.chara${chara.Id} #lastLinks.assets .rank_list.rank${index}`).length == 0) {
                $(`#grailBox.chara${chara.Id} #lastLinks.assets`).append(`<div class="rank_list rank${index}"></div>`);
              }

              var rank = `<div class="rank item" data-id="${l.Link.CharacterId}">
                <div class="title">第${index}位</div>
                <div class="name">「${l.Link.Name}」</div>
                <div class="count">+${formatNumber(l.LinkedAssets, 0)}</div>
              </div>`;

              $(`#grailBox.chara${chara.Id} #lastLinks.assets .rank_list.rank${index}`).append(rank);
              lastLinkId = l.LinkId;
              index++;
            }

            $(`#grailBox.chara${chara.Id} #lastLinks.assets .rank_list.rank${index - 1}`).append(`<div class="link item">${link}<div class="name"><a target="_blank" title="${l.Nickname}" href="/user/${l.Name}">@${l.Nickname} +${formatNumber(sacrifices, 0)}</a></div></div>`);
            $(`#grailBox.chara${chara.Id} #lastLinks.assets .item .card[data-id="${l.CharacterId}"]`).data('temple', l);
            $(`#grailBox.chara${chara.Id} #lastLinks.assets .item .card[data-id="${l.Link.CharacterId}"]`).data('temple', l.Link);
          }
        });
      } else {
        $(`#grailBox.chara${chara.Id} .desc.link_desc`).hide();
        $(`#grailBox.chara${chara.Id} #lastLinks.assets`).hide();
      }

      $(`#grailBox.chara${chara.Id} #lastLinks.assets .item .card`).on('click', templeCardClicked);
      $(`#grailBox.chara${chara.Id} #lastLinks.assets .rank.item`).on('click', characterNameClicked);
    }

    loadFixedAssets(chara, callback);
  });
}

function templeCardClicked(e) {
  var temple = $(e.currentTarget).data('temple');
  if (temple)
    showTemple(temple);
}

function characterNameClicked(e) {
  var cid = $(e.currentTarget).data('id');
  openCharacterDialog(cid);
}

function loadFixedAssets(chara, callback) {
  getData(`chara/temple/${chara.Id}`, function (d) {
    if (d.State === 0) {
      $(`#grailBox.chara${chara.Id} #lastTemples.assets`).empty();
      $(`#grailBox.chara${chara.Id} .assets_box .temple_count`).text(`固定资产 ${d.Value.length}`);
      // $(`#grailBox.chara${chara.Id} .assets_box .temple_count`).show();
      // $(`#grailBox.chara${chara.Id} .assets_box .link_count`).hide();
      $(`#grailBox.chara${chara.Id} #lastTemples`).data('loaded', true);

      if ($(`#grailBox.chara${chara.Id} #expandButton`).length == 0)
        $(`#grailBox.chara${chara.Id} .assets_box .temple_desc.desc .bold`).append(`<button id="expandButton" data-expanded="false" class="text_button">[+显示全部]</button>`);

      var temples = {};
      var visibleTemples = [];
      for (i = 0; i < d.Value.length; i++) {
        var temple = d.Value[i];
        temple.Replicates = 0;
        temples[temple.UserId] = temple;

        var replicate = visibleTemples.find(t => { return t.Cover == temple.Cover && t.Level == temple.Level });
        if (replicate) {
          temple.Replicated = true;
          replicate.Replicates += 1;
        } else {
          visibleTemples.push(temple);
        }
      }

      for (i = 0; i < d.Value.length; i++) {
        var temple = d.Value[i];
        var card = renderTemple(temple, 'fix');
        $('.assets_box #lastTemples.assets').append(card);
        $(`.assets_box #lastTemples.assets .item[data-id="${temple.UserId}#${temple.CharacterId}"]`).data('temple', temple);
      }

      $('.assets_box #lastTemples.assets').on('click', '.card', (e) => {
        var temple = $(e.currentTarget).parent().data('temple');
        showTemple(temple, chara);
      });

      if (d.Value.length === 0) {
        var card = '<div class="empty">啊咧？啥都没有~( T oT)//</div>';
        $('.assets_box #lastTemples.assets').append(card);
      }

      $(`#grailBox.chara${chara.Id} #expandButton`).on('click', e => {
        if (!$(e.currentTarget).data('expanded')) {
          $(e.currentTarget).data('expanded', true);
          $(e.currentTarget).text('[-隐藏重复]');
          $(`#grailBox.chara${chara.Id} #lastTemples.assets .item`).addClass('expanded');
        } else {
          $(e.currentTarget).data('expanded', false);
          $(e.currentTarget).text('[+显示全部]');
          $(`#grailBox.chara${chara.Id} #lastTemples.assets .item`).removeClass('expanded');
        }
      });
    }

    // $(`#grailBox.chara${chara.Id} #lastLinks`).hide();
    // $(`#grailBox.chara${chara.Id} #lastTemples`).show();
    if (callback) callback();
  });
}

function renderTemple(temple, type) {
  var avatar = normalizeAvatar(temple.Avatar);
  var full = formatNumber(temple.Sacrifices, 0);

  var charaName = temple.Name;
  if (temple.CharacterName)
    charaName = temple.CharacterName;

  var templeLevel = temple.Level;
  if (temple.Index)
    templeLevel = temple.Index;

  var grade = '';
  var rate = '';
  var level = '';
  var line = '';
  var lineDisplay = 'display:none;';
  if (temple.Line && temple.Line.length > 0) {
    line = encodeHtml(temple.Line);
    lineDisplay = '';
  }

  if (temple.Level == 1) {
    grade = '光辉圣殿';
    rate = '+0.10';
    level = ' silver';
  } else if (temple.Level == 2) {
    grade = '闪耀圣殿';
    rate = '+0.30';
    level = ' gold';
  } else if (temple.Level == 3) {
    grade = '奇迹圣殿';
    rate = '+0.60';
    level = ' purple';
  }

  var title = `<div class="title" data-id="${temple.CharacterId}">
  <span class="badge lv${temple.CharacterLevel}">lv${temple.CharacterLevel}</span><span data-id="${temple.CharacterId}" title="${charaName} ${formatNumber(temple.Assets, 0)} / ${full}">${charaName}</span>
  </div>`;
  var name = `<div class="name">
  <span title="${rate} / ${formatNumber(temple.Assets, 0)} / ${full}">${formatNumber(temple.Assets, 0)} / ${full}</span>
  </div>`;

  if (type != 'fix') {
    rate = `+${formatNumber(temple.Rate, 2)}`;
  } else {
    title = `<div class="title">
    <span title="+${formatNumber(temple.Rate, 2)} / ${formatNumber(temple.Assets, 0)} / ${full}">${formatNumber(temple.Assets, 0)} / ${full}</span>
    </div>`;
  }

  if (type == 'extra') {
    rate = `+₵${formatNumber(temple.Extra, 0)}`;
    grade = `超出总额 ₵${formatNumber(temple.Extra, 0)}`;

    if (temple.Extra < 0) {
      rate = `-₵${formatNumber(-temple.Extra, 0)}`;
      grade = `未满余额 ₵${formatNumber(temple.Extra, 0)}`;
    }

    if (templeLevel == 1 && temple.Extra > 0) {
      level = ' gold';
    } else if (templeLevel == 2 && temple.Extra > 0) {
      level = ' silver';
    } else if (templeLevel == 3 && temple.Extra > 0) {
      level = ' bronze';
    }

    name = `<div class="name auction_button" data-id="${temple.CharacterId}">
    <span title="竞拍人数 / 竞拍数量 / 拍卖总数">${formatNumber(temple.Type, 0)} / ${formatNumber(temple.Assets, 0)} / ${full}</span>
    </div>`;
  }

  if (type != 'mine' && type != 'extra') {
    var replicates = '';

    if (temple.Replicates && temple.Replicates > 0)
      replicates = `<span class="replicates">×${temple.Replicates + 1}</span>`;

    name = `<div class="name">
    <a target="_blank" title="${temple.Nickname}" href="/user/${temple.Name}">@${temple.Nickname}</a>
    ${replicates}
    </div>`;
  }

  var cover = '';
  if (temple.Cover) {
    //cover = getSmallCover(temple.Cover);
    cover = `<div class="card" title="${line}" data-id="${temple.UserId}#${temple.CharacterId}" style="background-image:url(${getSmallCover(temple.Cover)})">
      <div title="${grade}" class="tag"><span>${templeLevel}</span></div>
      <div class="buff">${rate}</div>
      <div class="line" style="${lineDisplay}">...</div>
    </div>`;
  } else {
    cover = `<div class="card" title="${line}" data-id="${temple.UserId}#${temple.CharacterId}">
    <div class="avatar_bg" style="background-image:url(${avatar})"></div>
    <div class="avatar" style="background-image:url(${avatar})"></div>
    <div class="tag"><span>${templeLevel}</span></div>
    <div class="buff">${rate}</div>
    <div class="line" style="${lineDisplay}">...</div>
    </div>`;
  }

  var replicated = '';
  if (temple.Replicated)
    replicated = ' replicated';

  var card = `<div class="item${level}${replicated}" data-id="${temple.UserId}#${temple.CharacterId}">
          ${cover}
          ${title}
          ${name}
        </div>`

  return card;
}

function encodeHtml(s) {
  var regx = /"|&|'|<|>|[\x00-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g;
  return (typeof s != 'string') ? s :
    s.replace(regx,
      function ($0) {
        var c = $0.charCodeAt(0), r = ['&#'];
        c = (c == 0x20) ? 0xA0 : c;
        r.push(c); r.push(';');
        return r.join('');
      });
};

function sacrificeCharacter(id, count, captial, callback) {
  postData(`chara/sacrifice/${id}/${count}/${captial}`, null, (d) => {
    if (callback) { callback(d); }
  });
}

function askCharacter(id, count, price, callback) {
  postData(`chara/ask/${id}/${price}/${count}`, null, function (d) {
    if (callback) callback(d);
  });
}

function showTemple(temple, chara) {
  var cover = getLargeCover(temple.Cover);
  var action = `<div class="action">
      <button style="display:none" id="changeCoverButton" class="text_button">[修改]</button>
      <button style="display:none" id="resetCoverButton" class="text_button">[重置]</button>
      <button style="display:none" id="linkButton" class="text_button">[LINK]</button>
      <button style="display:none" id="editLineButton" class="text_button">[台词]</button>
      <button style="display:none" id="sourceButton" class="text_button">[来源]</button>
      <button style="display:none" id="chaosCubeButton" class="text_button">[混沌魔方]</button>
      <button style="display:none" id="guidePostButton" class="text_button">[虚空道标]</button>
      <button style="display:none" id="chargeButton" class="text_button">[星光碎片]</button>
      <input style="display:none" id="picture" type="file" accept="image/*">
    </div>`;

  var position = '';
  if (cover.indexOf('//lain.') >= 0)
    position = 'background-position:top;';

  //var image=`<div class="card" style="background-image:url(${cover});${position}">`;
  var image = `<img class="cover" src='${cover}' />`;
  var name = temple.CharacterName;
  if (!temple.CharacterName)
    name = temple.Name;
  if (chara)
    name = chara.Name;

  var lineDisplay = 'display:none;';
  var lineContent = '';
  if (temple.Line && temple.Line.length > 0) {
    lineContent = encodeHtml(temple.Line);
    var lines = temple.Line.split('\n');
    if (lines.length > 1) {
      lineContent = '';
      lines.forEach(l => lineContent += `<div>${encodeHtml(l)}</div>`);
    }
  }

  if (temple.Line && temple.Line.length > 0)
    lineDisplay = '';
  var line = `<div class="line" style="${lineDisplay}">
  <div class="name">${name}</div>
  <div class="text">
    <span>${lineContent}</span>
    <textarea id="editLine" style="display:none;">${lineContent}</textarea>
  </div>
  </div>`;

  var dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
  <div id="TB_window" class="dialog temple" style="display:block;">
    <div class="container">
      ${image}
      ${line}
    </div>
      ${action}
      <div class="loading" style="display:none;"></div>
      <a id="TB_closeWindowButton" title="Close">X关闭</a>
    </div>
  </div>`;
  $('body').append(dialog);

  var showEdit = (e) => {
    $('#TB_window.temple .line').show();
    $('#TB_window.temple .line .text>span').hide();
    $('#TB_window.temple .line .text>textarea').show();
    $('#editLine').focus();
    e.stopPropagation();
  };

  var commitEdit = (e) => {
    //console.log('lost focus');
    var value = $('#editLine').val();
    var oldValue = $('#TB_window.temple .line .text>span').text();
    if (value != oldValue) {
      $('#TB_window.temple .line .text>span').text(value);
      postData(`chara/temple/line/${temple.CharacterId}`, value, function (d) {
        if (d.State != 0) {
          alert(d.Message);
        }
      });
    }
    $('#TB_window.temple .line .text>span').show();
    $('#TB_window.temple .line .text>textarea').hide();
    e.stopPropagation();
  };

  getUserAssets((d) => {
    if (d.State == 0) {
      if (d.Value.Id == temple.UserId) {
        $('#changeCoverButton').show();
        $('#resetCoverButton').show();
        $('#editLineButton').show();
        $('#chaosCubeButton').show();
        $('#guidePostButton').show();
        $('#linkButton').show();
        $('#sourceButton').show();
        $('#chargeButton').show();
        $('#TB_window.temple').on('click', '.line .text', showEdit);

        var username = d.Value.Name;

        $('#linkButton').on('click', e => {
          closeDialog();
          openSearchCharacterDialog(temple, username, 'link');
          e.stopPropagation();
        });

        $('#guidePostButton').on('click', e => {
          closeDialog();
          openSearchCharacterDialog(temple, username, 'guidepost');
          e.stopPropagation();
        });

        $('#chargeButton').on('click', e => {
          closeDialog();
          openSearchCharacterDialog(temple, username, 'stardust');
          e.stopPropagation();
        });
      }
      if (d.Value.Type >= 999 || d.Value.Id == 702) {
        $('#resetCoverButton').show();
      }
    }
  });

  $('#TB_closeWindowButton').on('click', closeDialog);
  $('#TB_window.temple img.cover').on('click', e => {
    //console.log('click image');
    if ($('#TB_window.temple .line .text>textarea').is(':visible'))
      commitEdit(e);
    else if ($('#TB_window.temple .line').is(':visible'))
      $('#TB_window.temple .line').hide();
    else if (temple.Line && temple.Line.length > 0)
      $('#TB_window.temple .line').show();
  });
  $('#TB_overlay').on('click', closeDialog);

  $('#changeCoverButton').on('click', (e) => {
    $("#picture").click();
    e.stopPropagation();
  });
  $('#resetCoverButton').on('click', (e) => {
    resetTempleCover(temple);
    e.stopPropagation();
  });
  $('#chaosCubeButton').on('click', e => {
    closeDialog();
    openScratchDialog(temple.CharacterId);
    e.stopPropagation();
  });

  $('#editLineButton').on('click', showEdit);
  //$('#editLine').blur(commitEdit);

  $("#picture").on("change", function () {
    if (this.files.length > 0) {
      var file = this.files[0];
      var data = window.URL.createObjectURL(file);

      var newImage = `<div class="card" style="background-image:url(${data})">`;
      $('#TB_window img.cover').hide();
      $('#TB_window').prepend(newImage);
      $('#TB_window .action').hide();
      $('#TB_window .loading').show();

      if (!/image+/.test(file.type)) {
        alert("请选择图片文件。");
        return;
      }

      var reader = new FileReader();
      reader.onload = (ev) => {
        var result = ev.target.result;
        $.getScript('https://cdn.jsdelivr.net/gh/emn178/js-md5/build/md5.min.js', function () {
          var hash = md5(result);
          var blob = dataURLtoBlob(result);
          var url = `https://tinygrail.oss-cn-hangzhou.aliyuncs.com/cover/${hash}.jpg`;

          getOssSignature('cover', hash, encodeURIComponent(file.type), function (d) {
            if (d.State === 0) {
              var xhr = new XMLHttpRequest();
              xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                  if (xhr.status == 200) {
                    postData(`chara/temple/cover/${temple.CharacterId}`, url, function (d) {
                      if (d.State == 0) {
                        alert("更换封面成功。");
                        if (chara)
                          loadTradeBox(chara);
                      } else {
                        alert(d.Message);
                      }
                    });
                  } else {
                    alert('图片上传失败。');
                  }

                  $('#TB_window .action').show();
                  $('#TB_window .loading').hide();
                }
              };

              xhr.open('PUT', url);
              xhr.setRequestHeader('Authorization', `OSS ${d.Value.Key}:${d.Value.Sign}`);
              xhr.setRequestHeader('x-oss-date', d.Value.Date);
              xhr.send(blob);
            }
          });
        });
      };
      reader.readAsDataURL(file);
    }
  });
}

function fixRightTempleImageReso() {
  let pageWidth = window.innerWidth;
  let pageHeight = window.innerHeight;
  let imgHeight = 640;
  let imgWidth = 480;

  if (window.innerWidth <= 640) {
    imgHeight = pageHeight * 0.9;
    imgWidth = imgHeight * 2 / 3;
  }

  let styles = {
    'height': imgHeight + 'px',
    'width': imgWidth + 'px',
  };

  $('#TB_window.dialog.temple .card').css(styles);
}

function getLargeCover(cover) {
  if (cover.indexOf('/crt/m/') >= 0)
    return cover.replace('/m/', '/l/');

  if (cover.startsWith('https://tinygrail.oss-cn-hangzhou.aliyuncs.com/'))
    return cdn + cover.substr(46) + '!w480';
  else if (cover.startsWith('/cover'))
    return cdn + cover + '!w480';

  return cover;
}

function getSmallCover(cover) {
  if (cover.indexOf('/crt/g/') >= 0)
    return cover.replace('/g/', '/m/');

  if (cover.startsWith('https://tinygrail.oss-cn-hangzhou.aliyuncs.com/'))
    return cdn + cover.substr(46) + '!w150';
  else if (cover.startsWith('/cover'))
    return cdn + cover + '!w150';

  return cover;
}

function resetTempleCover(temple, callback) {
  $('#TB_window .action').hide();
  $('#TB_window .loading').show();
  postData(`chara/temple/cover/reset/${temple.CharacterId}/${temple.UserId}`, null, (d) => {
    if (d.State == 0) {
      var cover = d.Value.Cover;
      var large = getLargeCover(cover);
      $(`.assets .card[data-id=${temple.UserId}]`).css('background-image', `url(${cover})`);
      $('#TB_window .card').css('background-image', `url(${large})`);
      $('#TB_window .action').show();
      $('#TB_window .loading').hide();
      alert('重置封面完成。');
    }
  });
}

function openSacrificeDialog(chara, amount) {
  var dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
  <div id="TB_window" class="dialog" style="display:block;">
    <div class="title">资产重组 - #${chara.Id} 「${chara.Name}」 ${formatNumber(amount, 0)} / ${formatNumber(chara.Total, 0)}</div>
    <div class="desc">将股份转化为固定资产，同时获得现金奖励并掉落道具。输入资产重组的数量：</div>
    <div class="option"><button id="captialButton" class="checkbox">股权融资<span class="slider"><span class="button"></span></span></button></div>
    <div class="trade finance"><input class="amount" type="number" min="1" max="${amount}" value="500"><button id="financeButton" class="active">确定</button><button id="cancelDialogButton">取消</button></div>
    <div class="loading" style="display:none"></div>
    <a id="TB_closeWindowButton" title="Close">X关闭</a>
  </div>`;
  $('body').append(dialog);
  // $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
  // $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
  $('#cancelDialogButton').on('click', closeDialog);
  $('#TB_closeWindowButton').on('click', closeDialog);
  $('#captialButton').on('click', (e) => {
    if ($('#captialButton').hasClass('on')) {
      $('#captialButton').removeClass('on');
      $('#captialButton .button').animate({ 'margin-left': '0px' });
      $('#captialButton .button').css('background-color', '#ccc');
      $('#TB_window .desc').text('将股份转化为固定资产，同时获得现金奖励并掉落道具。输入资产重组的数量：');
    } else {
      $('#captialButton').addClass('on');
      $('#captialButton .button').animate({ 'margin-left': '20px' });
      $('#captialButton .button').css('background-color', '#7fc3ff');
      $('#TB_window .desc').text('将股份出售给幻想乡，立刻获取现金。输入股权融资的数量：');
      $('.trade.finance input').val(amount);
    }
  });
  $('#financeButton').on('click', function () {
    var count = $('.trade.finance input').val();
    $("#TB_window .loading").show();
    $("#TB_window .desc").hide();
    $("#TB_window .option").hide();
    $("#TB_window .trade").hide();
    var captial = $('#captialButton').hasClass('on');
    sacrificeCharacter(chara.Id, count, captial, (d) => {
      $("#TB_window .loading").hide();
      $("#TB_window .desc").show();
      $("#TB_window .option").show();
      $("#TB_window .trade").show();
      if (d.State == 0) {
        var message = `融资完成！获得资金 ₵${formatNumber(d.Value.Balance, 0)}`;
        if (d.Value.Items && d.Value.Items.length > 0) {
          message += ' 掉落道具';
          for (i = 0; i < d.Value.Items.length; i++) {
            var item = d.Value.Items[i];
            message += ` 「${item.Name}」×${item.Count}`;
          }
        }
        $("#TB_window .option").hide();
        $('#TB_window .trade.finance').hide();
        $('#TB_window .desc').text(message);

        loadTradeBox(chara);
      } else {
        alert(d.Message);
      }
    });
  });
}

function openRecommendDialog(uid, name) {
  var dialog = `<div id="recommendDialog" class="new_overlay">
  <div class="new_dialog">
    <div class="info_box">
      <div class="title">推荐关系详情 - ${name}</div>
      <div class="desc" style="display:none"></div>
      <div class="result" style="display:none"></div>
    </div>
    <div class="loading"></div>
    <a class="close_button" title="Close">X关闭</a>
  </div></div>`;
  $('body').append(dialog);

  getData(`chara/recommend/user/${uid}`, (d => {
    $('#recommendDialog .loading').hide();
    if (d.State == 0) {
      d.Value.Recommends.forEach((a) => {
        //var name = '';
        //var uid = '';
        var list = a.Description.match(/推荐人奖励：(.*?) \((.*?)#/);
        if (list && list.length > 2) {
          var name = list[1];
          var uid = list[2];
          var record = `<div class="row">
          <span class="time">${formatDate(a.LogTime)}</span>
          <span class="user" title="被推荐人"><a target="_blank" href="/user/${uid}">${name}</a></span></div>`;
          $('#recommendDialog .result').append(record);
        }
      });

      var count = d.Value.Recommends.length;
      $('#recommendDialog .desc').text(`共推荐${count}人，获得奖励₵${formatNumber(count * 10000)}`);
      if (d.Value.Recommender) {
        console.log(d.Value.Recommender);
        var list2 = d.Value.Recommender.Description.split('#');
        if (list2.length > 1) {
          $('#recommendDialog .desc').append(`<a style="margin-left:10px" target="_blank" href="/user/${list2[0]}">推荐人：${list2[1]}</a>`);
        }
      }
      $('#recommendDialog .result').show();
      centerDialog('#recommendDialog .new_dialog');
    }

    $('#recommendDialog .desc').show();
    addCloseDialog('#recommendDialog');
    // $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
    // $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
  }));

  // $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
  // $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
  //$('#TB_closeWindowButton').on('click', closeDialog);
}

function openHistoryDialog(chara) {
  var dialog = `<div id="auctionHistoryDialog" class="new_overlay">
  <div class="new_dialog">
    <div class="info_box">
      <div class="title">上周拍卖结果 - #${chara.Id} 「${chara.Name}」 ₵${formatNumber(chara.Current, 2)} / ${formatNumber(chara.Total, 0)}</div>
      <div class="desc" style="display:none"></div>
      <div class="result" style="display:none"></div>
    </div>
    <div class="loading"></div>
    <a class="close_button" title="Close">X关闭</a>
  </div>
  </div>`;
  $('body').append(dialog);
  $('body').css('overflow-y', 'hidden');

  getData(`chara/auction/list/${chara.Id}/1`, (d => {
    $('#auctionHistoryDialog .loading').hide();
    if (d.State == 0 && d.Value.length > 0) {
      var success = 0;
      var total = 0;
      d.Value.forEach((a) => {
        var state = "even";
        var name = "失败";
        if (a.State == 1) {
          success++;
          total += a.Amount;
          state = "raise";
          name = "成功";
        }

        var record = `<div class="row">
          <span class="time">${formatDate(a.Bid)}</span>
          <span class="user"><a target="_blank" href="/user/${a.Username}">${a.Nickname}</a></span>
          <span class="price">₵${formatNumber(a.Price, 2)} / ${formatNumber(a.Amount, 0)}</span>
          <span class="tag ${state}">${name}</span>
        </div>`;
        $('#auctionHistoryDialog .result').append(record);
      });
      $('#auctionHistoryDialog .desc').text(`共有${d.Value.length}人参与拍卖，成功${success}人 / ${total}股`);
      $('#auctionHistoryDialog .result').show();
    } else {
      $('#auctionHistoryDialog .desc').text('暂无拍卖数据');
    }
    $('#auctionHistoryDialog .desc').show();
    centerDialog('#auctionHistoryDialog .new_dialog');
  }));

  centerDialog('#auctionHistoryDialog .new_dialog');
  addCloseDialog('#auctionHistoryDialog');
}

function centerDialog(id) {
  var w = $(id).width();
  var h = $(id).height();

  if (window.innerHeight > h) {
    $(id).css('top', (window.innerHeight - h) / 2 - 40);
  } else {
    $(id).css('top', 0);
  }

  if (window.innerWidth > w) {
    $(id).css('left', (window.innerWidth - w) / 2 - 40);
  } else {
    $(id).css('left', 0);
  }
}

function openTradeHistoryDialog(chara) {
  var dialog = `<div id="tradeHistoryDialog" class="new_overlay">
  <div class="new_dialog">
    <div class="info_box">
      <div class="title">交易历史记录 - #${chara.Id} 「${chara.Name}」 ₵${formatNumber(chara.Current, 2)} / ${formatNumber(chara.Total, 0)}</div>
      <div class="desc" style="display:none"></div>
      <div class="result" style="display:none"></div>
    </div>
    <div class="loading"></div>
    <a class="close_button" title="Close">X关闭</a>
  </div>
  </div>`;
  $('body').append(dialog);

  loadTradeHistory('#tradeHistoryDialog', chara.Id, 1, false);

  centerDialog('#tradeHistoryDialog .new_dialog');
  addCloseDialog('#tradeHistoryDialog');
  // $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
  // $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
  //$('#TB_closeWindowButton').on('click', closeDialog);
}

function openUserHistoryDialog(user) {
  var dialog = `<div id="userHistoryDialog" class="new_overlay">
  <div class="new_dialog">
    <div class="info_box">
      <div class="title">用户交易记录 - @${user.Name} 「${user.Nickname}」 ₵${formatNumber(user.Balance, 2)} / ${formatNumber(user.Assets, 0)}</div>
      <div class="desc" style="display:none"></div>
      <div class="result" style="display:none"></div>
    </div>
    <div class="loading"></div>
    <a class="close_button" title="Close">X关闭</a>
  </div></div>`;
  $('body').append(dialog);

  loadTradeHistory('#userHistoryDialog', user.Id, 1, true);

  // $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
  // $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
  centerDialog('#userHistoryDialog .new_dialog');
  addCloseDialog('#userHistoryDialog');
}

function openSendLogDialog(user) {
  var dialog = `<div id="userSendLogDialog" class="new_overlay">
  <div class="new_dialog">
    <div class="info_box">
      <div class="title">用户红包记录 - @${user.Name} 「${user.Nickname}」</div>
      <div class="desc" style="display:none"></div>
      <div class="result" style="display:none"></div>
    </div>
    <div class="loading"></div>
    <a class="close_button" title="Close">X关闭</a>
  </div></div>`;
  $('body').append(dialog);

  loadUserSendLog('#userSendLogDialog', user.Name, 1);

  // $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
  // $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
  centerDialog('#userSendLogDialog .new_dialog');
  addCloseDialog('#userSendLogDialog');
}

function loadUserSendLog(target, username, page) {
  $(`${target} .result`).hide();
  $(`${target} .loading`).show();
  getData(`chara/user/send/log/${username}/${page}/20`, (d => {
    $(`${target} .loading`).hide();
    $(`${target} .result`).show();
    $(`${target} .result`).html('');
    if (d.State == 0 && d.Value.TotalItems > 0) {
      d.Value.Items.forEach(a => {
        var record = `<div class="row">
          <span class="time" title="时间">${formatDate(a.LogTime)}</span>
          <span class="fit sub" title="类型">[${getTypeName(a.Type)}]</span>
          <span class="fit" title="金额">₵${formatNumber(Math.abs(a.Change), 2)}</span>
          <span class="info" title="信息"><a target="_blank" href="/user/${a.RelatedName}">${a.Description}</a></span>
        </div>`;
        $(`${target} .result`).append(record);
      });

      $(`${target} .desc`).html('');
      $(`${target} .desc`).text(`共有${d.Value.TotalItems}条记录，当前 ${d.Value.CurrentPage} / ${d.Value.TotalPages} 页`);

      for (var i = 1; i <= d.Value.TotalPages; i++) {
        var pager = `<span class="page" data-page="${i}">[${i}]</span>`;
        $(`${target} .desc`).append(pager);
      }

      $(`${target} .desc .page`).on('click', (e) => {
        var p = $(e.currentTarget).data('page');
        loadUserSendLog(target, username, p);
      });

      $(`${target} .result`).show();
    } else {
      $(`${target} .desc`).text('暂无交易记录');
    }
    $(`${target} .desc`).show();
    // $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
    // $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
    centerDialog(`${target} .new_dialog`);
  }));
}

function getTypeName(type) {
  if (type == 1) {
    return "奖励";
  } else if (type == 2) {
    return "参与ICO";
  } else if (type == 3) {
    return "ICO退款";
  } else if (type == 4) {
    return "买入";
  } else if (type == 5) {
    return "取消买入";
  } else if (type == 6) {
    return "卖出";
  } else if (type == 7) {
    return "交易税";
  } else if (type == 8) {
    return "取消卖出";
  } else if (type == 9) {
    return "资产重组";
  } else if (type == 10) {
    return "参与竞拍";
  } else if (type == 11) {
    return "取消竞拍";
  } else if (type == 12) {
    return "竞拍结算";
  } else if (type == 13) {
    return "ICO成功";
  } else if (type == 14) {
    return "领取股息";
  } else if (type == 15) {
    return "系统修复";
  } else if (type == 16) {
    return "发出红包";
  } else if (type == 17) {
    return "收到红包";
  }
  return "缺省";
}

function loadTradeHistory(target, id, page, isUser) {
  $(`${target} .result`).hide();
  $(`${target} .loading`).show();

  var url = `chara/history/${id}/${page}`;
  if (isUser)
    url = `chara/user/history/${id}/${page}`;

  getData(url, (d => {
    $(`${target} .loading`).hide();
    $(`${target} .result`).show();
    $(`${target} .result`).html('');
    if (d.State == 0 && d.Value.TotalItems > 0) {
      d.Value.Items.forEach(a => {
        var chara = ``;
        if (isUser)
          chara = `<span class="fit"><a target="_blank" href="/character/${a.CharacterId}">#${a.CharacterId}「${a.Name}」</a></span>`;

        var record = `<div class="row">
          <span class="time" title="交易时间">${formatDate(a.TradeTime)}</span>
          ${chara}
          <span class="fit user" title="卖家"><a target="_blank" href="/user/${a.Seller}">${a.SellerName}</a></span>
          <span class="fit user" title="买家"><a target="_blank" href="/user/${a.Buyer}">${a.BuyerName}</a></span>
          <span class="fit" title="价格 / 数量">₵${formatNumber(a.Price, 2)} / ${formatNumber(a.Amount, 0)}</span>
        </div>`;
        $(`${target} .result`).append(record);
      });

      $(`${target} .desc`).html('');
      $(`${target} .desc`).text(`共有${d.Value.TotalItems}条记录，当前 ${d.Value.CurrentPage} / ${d.Value.TotalPages} 页`);

      for (var i = 1; i <= d.Value.TotalPages; i++) {
        var pager = `<span class="page" data-page="${i}">[${i}]</span>`;
        $(`${target} .desc`).append(pager);
      }

      $(`${target} .desc .page`).on('click', (e) => {
        var p = $(e.target).data('page');
        loadTradeHistory(target, id, p, isUser);
      })

      $(`${target} .result`).show();
    } else {
      $(`${target} .desc`).text('暂无交易记录');
    }
    $(`${target} .desc`).show();
    centerDialog(`${target} .new_dialog`);
  }));
}

function openUserLogDialog(username, nickname) {
  var dialog = `<div id="userLogDialog" class="new_overlay">
  <div class="new_dialog">
    <div class="info_box">
      <div class="title">用户资金日志 - @${username} 「${nickname}」</div>
      <div class="desc" style="display:none"></div>
      <div class="result" style="display:none"></div>
    </div>
    <div class="loading"></div>
    <a class="close_button" title="Close">X关闭</a>
  </div></div>`;
  $('body').append(dialog);

  loadAdminUserLog(username, 1);
  addCloseDialog('#userLogDialog');
  // $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
  // $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
  //$('#TB_closeWindowButton').on('click', closeDialog);
}

function loadAdminUserLog(username, page) {
  $('#userLogDialog .result').hide();
  $('#userLogDialog .loading').show();
  getData(`chara/user/balance/${page}/20/${username}`, (d => {
    $('#userLogDialog .loading').hide();
    $('#userLogDialog .result').show();
    $('#userLogDialog .result').html('');
    if (d.State == 0 && d.Value.TotalItems > 0) {
      d.Value.Items.forEach(a => {
        var record = `<div class="row">
          <span class="time" title="时间">${formatDate(a.LogTime)}</span>
          <span class="fit" title="资金余额">₵${formatNumber(a.Balance, 2)}</span>
          <span class="fit" title="资金变动 / 股份变动">₵${formatNumber(a.Change, 2)} / ${formatNumber(a.Amount, 0)}</span>
          <span class="fit" title="对象 / 类型">#${a.RelatedId} / ${getTypeName(a.Type)}</span>
          <span class="info" title="信息">${a.Description}</span>
        </div>`;
        $('#userLogDialog .result').append(record);
      });

      $('#userLogDialog .desc').html('');
      $('#userLogDialog .desc').text(`共有${d.Value.TotalItems}条记录，当前 ${d.Value.CurrentPage} / ${d.Value.TotalPages} 页`);

      for (var i = 1; i <= d.Value.TotalPages; i++) {
        var pager = `<span class="page" data-page="${i}">[${i}]</span>`;
        $('#userLogDialog .desc').append(pager);
      }

      $('#userLogDialog .desc .page').on('click', (e) => {
        var p = $(e.target).data('page');
        loadAdminUserLog(username, p);
      })

      $('#userLogDialog .result').show();
    } else {
      $('#userLogDialog .desc').text('暂无交易记录');
    }
    $('#userLogDialog .desc').show();
    // $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
    // $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
    centerDialog('#userLogDialog .new_dialog');
  }));
}

function closeDialog() {
  $('#TB_overlay').remove();
  $('#TB_window').remove();
}

function loadBoardMember(id, page, total, callback) {
  getData(`chara/users/${id}/${page}/20`, function (d, s) {
    if (d.State === 0 && d.Value.Items && d.Value.Items.length > 0) {
      if (page == 1) {
        var count = 10;
        if (d.Value.Items.length < 10)
          count = d.Value.Items.length;
        var box = `<div class="board_box"><div class="desc"><div class="bold">董事会 ${count}<span class="sub"> / ${d.Value.TotalItems}</span></div></div><div class="users"></div></div>`;
        $(`#grailBox.chara${id} .grail_box.loading`).before(box);
      }

      var modifiers = [];
      var chairmanActive = false;
      var index = (page - 1) * 20;

      for (i = 0; i < d.Value.Items.length; i++) {
        var user = d.Value.Items[i];
        var avatar = normalizeAvatar(user.Avatar);
        var p = formatNumber(user.Balance / total * 100, 2);
        var amount = formatNumber(user.Balance, 0);
        if (user.Balance == 0) {
          amount = '--';
          p = '??';
        }

        var inactive = '';
        var tag = 'tag new';
        if (index < 10)
          tag = 'tag board';

        if (!chairmanActive && index < 10)
          modifiers.push(user);

        var title = index + 1;
        if (index == 0) {
          title = "主席";
          tag = 'tag';
        }

        if (getTimeDiff(user.LastActiveDate) < 1000 * 60 * 60 * 24 * 5 && user.State != 666) {
          if (i == 0)
            chairmanActive = true;
        } else {
          inactive = 'inactive';
        }

        var banned = '';
        if (user.State == 666) {
          inactive = "banned";
          banned = '(被封禁)';
        }

        var badge = renderUserBadge(user);

        var u = `<div class="user ${inactive}">
        <a class="avatar" target="_blank" href="/user/${user.Name}" style="background-image:url(${avatar})">${badge}</a>
        <div class="name">
          <a target="_blank" title="${user.Nickname}${banned}" href="/user/${user.Name}"><span class="title">${title}</span>${user.Nickname}</a>
          <div class="${tag}">${amount} ${p}%</div>
        </div></div>`
        $(`#grailBox.chara${id} .board_box .users`).append(u);

        index++;
      }

      if (callback) callback(modifiers);

      $(`#grailBox.chara${id} .center_button`).remove();
      if (d.Value.CurrentPage < d.Value.TotalPages) {
        var loadMore = `<div class="center_button"><button id="loadBoardMemeberButton" data-page="${d.Value.CurrentPage + 1}" class="load_more_button">[加载更多...]</button></div>`
        $(`#grailBox.chara${id} .board_box`).after(loadMore);
        $('#loadBoardMemeberButton').on('click', (e) => {
          var p = $(e.currentTarget).data('page');
          loadBoardMember(id, p, total);
        });
      }
    }
  });
}

function caculateTotal() {
  var total = $('.trade_box .ask input.price').val() * $('.trade_box .ask input.amount').val();
  $('.trade_box .ask .label.total').text("+" + formatNumber(total, 2));

  var total2 = $('.trade_box .bid input.price').val() * $('.trade_box .bid input.amount').val();
  $('.trade_box .bid .label.total').text("-" + formatNumber(total2, 2));
}

function getMaxValue(list, field) {
  var max = 0;
  for (i = 0; i < list.length; i++) {
    var item = list[i][field];
    if (item > max)
      max = item;
  }
  return max;
}

function getMinValue(list, field) {
  var min = 9999999999;
  for (i = 0; i < list.length; i++) {
    var item = list[i][field];
    if (item < min)
      min = item;
  }
  return min;
}

function cancelAsk(id, callback) {
  postData(`chara/ask/cancel/${id}`, null, callback);
}

function cancelBid(id, callback) {
  postData(`chara/bid/cancel/${id}`, null, callback);
}

function loadChart(id, days) {
  var chart = `<div id="kChart"></div>`;
  $('.trade_box').before(chart);
  var begin = new Date();
  begin.setMilliseconds(0);
  begin.setSeconds(0);
  begin.setMinutes(0);
  begin.setHours(0);
  begin.setDate(begin.getDate() - days);

  $.getScript('https://cdn.jsdelivr.net/npm/echarts@4.2.1/dist/echarts.min.js', function () {
    getData(`chara/charts/${id}/${begin.format('yyyy-MM-dd')}`, function (d, s) {
      if (d.State === 0 && d.Value) {
        var kdata = getKData(d.Value);

        if (kdata.length < 100) {
          chartStart = 0;
        } else {
          chartStart = (kdata.length - 100) / kdata.length * 100;
        }

        var kChart = echarts.init(document.getElementById('kChart'));
        kChart.setOption(initKOption(kdata));
      }
    });
  });
}

function unloadChart() {
  $('#kChart').remove();
}

function addTimeStr(time, num) {
  var hour = time.split(':')[0];
  var mins = Number(time.split(':')[1]);
  var mins_un = parseInt((mins + num) / 60);
  var hour_un = parseInt((Number(hour) + mins_un) / 24);
  if (mins_un > 0) {
    if (hour_un > 0) {
      var tmpVal = ((Number(hour) + mins_un) % 24) + '';
      hour = tmpVal.length > 1 ? tmpVal : '0' + tmpVal;
    } else {
      var tmpVal = Number(hour) + mins_un + '';
      hour = tmpVal.length > 1 ? tmpVal : '0' + tmpVal;
    }
    var tmpMinsVal = ((mins + num) % 60) + '';
    mins = tmpMinsVal.length > 1 ? tmpMinsVal : 0 + tmpMinsVal;
  } else {
    var tmpMinsVal = mins + num + '';
    mins = tmpMinsVal.length > 1 ? tmpMinsVal : '0' + tmpMinsVal;
  }
  return hour + ':' + mins;
}
function getNextTime(startTime, endTIme, offset, resultArr) {
  var result = addTimeStr(startTime, offset);
  resultArr.push(result);
  if (result == endTIme) {
    return resultArr;
  } else {
    return getNextTime(result, endTIme, offset, resultArr);
  }
}
var time_arr = function (type) {
  if (type.indexOf('us') != -1) {
    var timeArr = new Array();
    timeArr.push('09:30');
    return getNextTime('09:30', '16:00', 1, timeArr);
  }
  if (type.indexOf('hs') != -1) {
    var timeArr = new Array();
    timeArr.push('09:30');
    timeArr.concat(getNextTime('09:30', '11:29', 1, timeArr));
    timeArr.push('13:00');
    timeArr.concat(getNextTime('13:00', '15:00', 1, timeArr));
    return timeArr;
  }
  if (type.indexOf('hk') != -1) {
    var timeArr = new Array();
    timeArr.push('09:30');
    timeArr.concat(getNextTime('09:30', '11:59', 1, timeArr));
    timeArr.push('13:00');
    timeArr.concat(getNextTime('13:00', '16:00', 1, timeArr));
    return timeArr;
  }
};
var get_m_data = function (m_data, type) {
  var priceArr = new Array();
  var avgPrice = new Array();
  var vol = new Array();
  var times = time_arr(type);
  $.each(m_data.data, function (i, v) {
    priceArr.push(v[1]);
    avgPrice.push(v[2]);
    vol.push(v[3]);
  });
  return {
    priceArr: priceArr,
    avgPrice: avgPrice,
    vol: vol,
    times: times,
  };
};
function initMOption(m_data, type) {
  var m_datas = get_m_data(m_data, type);
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: function (params, ticket, callback) {
        var i = params[0].dataIndex;
        var color;
        if (m_datas.priceArr[i] > m_data.yestclose) {
          color = 'style="color:#ff4242"';
        } else {
          color = 'style="color:#26bf66"';
        }
        var html =
          '<div class="commColor" style="width:100px;"><div>当前价<span  ' +
          color +
          ' >' +
          m_datas.priceArr[i] +
          '</span></div>';
        html +=
          '<div>均价<span  ' +
          color +
          ' >' +
          m_datas.avgPrice[i] +
          '</span></div>';
        html +=
          '<div>涨幅<span  ' +
          color +
          ' >' +
          ratioCalculate(m_datas.priceArr[i], m_data.yestclose) +
          '%</span></div>';
        html +=
          '<div>成交量<span  ' +
          color +
          ' >' +
          m_datas.vol[i] +
          '</span></div></div>';
        return html;
      },
    },
    legend: {
      icon: 'rect',
      type: 'scroll',
      itemWidth: 14,
      itemHeight: 2,
      left: 0,
      top: '-1%',
      textStyle: { fontSize: 12, color: fontColor },
    },
    axisPointer: { show: true },
    color: [ma5Color, ma10Color],
    grid: [
      { id: 'gd1', left: '0%', right: '1%', height: '67.5%', top: '5%' },
      { id: 'gd2', left: '0%', right: '1%', height: '67.5%', top: '5%' },
      { id: 'gd3', left: '0%', right: '1%', top: '75%', height: '19%' },
    ],
    xAxis: [
      {
        gridIndex: 0,
        data: m_datas.times,
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      {
        show: false,
        gridIndex: 1,
        data: m_datas.times,
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      {
        splitNumber: 2,
        type: 'category',
        gridIndex: 2,
        data: m_datas.times,
        axisLabel: { color: '#9b9da9', fontSize: 10 },
      },
    ],
    yAxis: [
      {
        gridIndex: 0,
        scale: true,
        splitNumber: 3,
        axisLabel: {
          inside: true,
          fontWeight: 'bold',
          color: function (val) {
            if (val == m_data.yestclose) {
              return '#aaa';
            }
            return val > m_data.yestclose ? upColor : downColor;
          },
        },
        z: 4,
        splitLine: { show: false, lineStyle: { color: splitLineColor } },
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 3,
        position: 'right',
        z: 4,
        axisLabel: {
          color: function (val) {
            if (val == m_data.yestclose) {
              return '#aaa';
            }
            return val > m_data.yestclose ? upColor : downColor;
          },
          inside: true,
          fontWeight: 'bold',
          formatter: function (val) {
            var resul = ratioCalculate(val, m_data.yestclose);
            return Number(resul).toFixed(2) + ' %';
          },
        },
        splitLine: { show: false, lineStyle: { color: splitLineColor } },
        axisPointer: {
          show: true,
          label: {
            formatter: function (params) {
              return ratioCalculate(params.value, m_data.yestclose) + '%';
            },
          },
        },
      },
      {
        gridIndex: 2,
        z: 4,
        splitNumber: 3,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#c7c7c7', inside: true, fontSize: 8 },
      },
    ],
    dataZoom: [],
    backgroundColor: bgColor,
    blendMode: 'source-over',
    series: [
      {
        name: '当前价',
        type: 'line',
        data: m_datas.priceArr,
        smooth: true,
        symbol: 'circle',
        lineStyle: {
          normal: { opacity: 0.8, color: '#39afe6', width: 1 },
        },
        areaStyle: {
          normal: {
            color: new echarts.graphic.LinearGradient(
              0,
              0,
              0,
              1,
              [
                { offset: 0, color: 'rgba(0, 136, 212, 0.7)' },
                { offset: 0.8, color: 'rgba(0, 136, 212, 0.02)' },
              ],
              false
            ),
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: 10,
          },
        },
      },
      {
        name: '均价',
        type: 'line',
        data: m_datas.avgPrice,
        smooth: true,
        symbol: 'circle',
        lineStyle: {
          normal: { opacity: 0.8, color: '#da6ee8', width: 1 },
        },
      },
      {
        type: 'line',
        data: m_datas.priceArr,
        smooth: true,
        symbol: 'none',
        gridIndex: 1,
        xAxisIndex: 1,
        yAxisIndex: 1,
        lineStyle: { normal: { width: 0 } },
      },
      {
        name: 'Volumn',
        type: 'bar',
        gridIndex: 2,
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: m_datas.vol,
        barWidth: '60%',
        itemStyle: {
          normal: {
            color: function (params) {
              var colorList;
              if (
                m_datas.priceArr[params.dataIndex] >
                m_datas.priceArr[params.dataIndex - 1]
              ) {
                colorList = upColor;
              } else {
                colorList = downColor;
              }
              return colorList;
            },
          },
        },
      },
    ],
  };
}
function ratioCalculate(price, yclose) {
  return (((price - yclose) / yclose) * 100).toFixed(3);
}
function splitData(rawData) {
  var datas = [];
  var times = [];
  var vols = [];
  for (var i = 0; i < rawData.length; i++) {
    datas.push(rawData[i]);
    times.push(rawData[i].splice(0, 1)[0]);
    vols.push(rawData[i][4]);
  }
  return { datas: datas, times: times, vols: vols };
}
function calculateMA(dayCount, data) {
  var result = [];
  for (var i = 0, len = data.times.length; i < len; i++) {
    if (i < dayCount) {
      result.push('-');
      continue;
    }
    var sum = 0;
    for (var j = 0; j < dayCount; j++) {
      sum += data.datas[i - j][1];
    }
    result.push((sum / dayCount).toFixed(2));
  }
  return result;
}
var calcEMA, calcDIF, calcDEA, calcMACD;
calcEMA = function (n, data, field) {
  var i, l, ema, a;
  a = 2 / (n + 1);
  if (field) {
    ema = [data[0][field]];
    for (i = 1, l = data.length; i < l; i++) {
      ema.push((a * data[i][field] + (1 - a) * ema[i - 1]).toFixed(2));
    }
  } else {
    ema = [data[0]];
    for (i = 1, l = data.length; i < l; i++) {
      ema.push((a * data[i] + (1 - a) * ema[i - 1]).toFixed(3));
    }
  }
  return ema;
};
calcDIF = function (short, long, data, field) {
  var i, l, dif, emaShort, emaLong;
  dif = [];
  emaShort = calcEMA(short, data, field);
  emaLong = calcEMA(long, data, field);
  for (i = 0, l = data.length; i < l; i++) {
    dif.push((emaShort[i] - emaLong[i]).toFixed(3));
  }
  return dif;
};
calcDEA = function (mid, dif) {
  return calcEMA(mid, dif);
};
calcMACD = function (short, long, mid, data, field) {
  var i, l, dif, dea, macd, result;
  result = {};
  macd = [];
  dif = calcDIF(short, long, data, field);
  dea = calcDEA(mid, dif);
  for (i = 0, l = data.length; i < l; i++) {
    macd.push(((dif[i] - dea[i]) * 2).toFixed(3));
  }
  result.dif = dif;
  result.dea = dea;
  result.macd = macd;
  return result;
};

function initKOption(cdata) {
  var data = splitData(cdata);
  var macd = calcMACD(12, 26, 9, data.datas, 1);
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: {
      icon: 'rect',
      type: 'scroll',
      itemWidth: 12,
      itemHeight: 4,
      left: 0,
      top: '1px',
      animation: true,
      textStyle: { fontSize: 12, color: fontColor },
      pageIconColor: '#0e99e2',
    },
    axisPointer: { show: true },
    color: [ma5Color, ma10Color, ma20Color, ma30Color],
    grid: [
      { id: 'gd1', left: '0%', right: '1%', height: '60%', top: '5%' },
      { left: '0%', right: '1%', top: '66.5%', height: '10%' },
      { left: '0%', right: '1%', top: '80%', height: '14%' },
    ],
    xAxis: [
      {
        type: 'category',
        data: data.times,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisLabel: { show: false },
        splitLine: { show: false, lineStyle: { color: splitLineColor } },
        splitNumber: 20,
        min: 'dataMin',
        max: 'dataMax',
      },
      {
        type: 'category',
        gridIndex: 1,
        data: data.times,
        axisLabel: { color: '#9b9da9', fontSize: 10 },
      },
      {
        type: 'category',
        gridIndex: 2,
        data: data.times,
        axisLabel: { show: false },
      },
    ],
    yAxis: [
      {
        scale: true,
        z: 4,
        axisLabel: { color: '#c7c7c7', inside: true },
        splitLine: { show: false, lineStyle: { color: splitLineColor } },
      },
      {
        gridIndex: 1,
        splitNumber: 3,
        z: 4,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#c7c7c7', inside: true, fontSize: 8 },
      },
      {
        z: 4,
        gridIndex: 2,
        splitNumber: 4,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#c7c7c7', inside: true, fontSize: 8 },
      },
    ],
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: [0, 1, 2],
        start: chartStart,
        end: chartEnd,
        throttle: 10,
        top: '94%',
        height: '6%',
        borderColor: '#696969',
        textStyle: { color: '#dcdcdc' },
        handleSize: '90%',
        handleIcon:
          'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        dataBackground: {
          lineStyle: { color: '#fff' },
          areaStyle: { color: '#696969' },
        },
      },
    ],
    animation: false,
    backgroundColor: bgColor,
    blendMode: 'source-over',
    series: [
      {
        name: 'Kandle',
        type: 'candlestick',
        data: data.datas,
        barWidth: '55%',
        large: true,
        largeThreshold: 100,
        itemStyle: {
          normal: {
            color: upColor,
            color0: downColor,
            borderColor: upColor,
            borderColor0: downColor,
          },
        },
      },
      {
        name: 'MA5',
        type: 'line',
        data: calculateMA(5, data),
        smooth: true,
        symbol: 'none',
        lineStyle: {
          normal: { opacity: 0.8, color: ma5Color, width: 1 },
        },
      },
      {
        name: 'MA10',
        type: 'line',
        data: calculateMA(10, data),
        smooth: true,
        symbol: 'none',
        lineStyle: {
          normal: { opacity: 0.8, color: ma10Color, width: 1 },
        },
      },
      {
        name: 'MA20',
        type: 'line',
        data: calculateMA(20, data),
        smooth: true,
        symbol: 'none',
        lineStyle: { opacity: 0.8, width: 1, color: ma20Color },
      },
      {
        name: 'MA30',
        type: 'line',
        data: calculateMA(30, data),
        smooth: true,
        symbol: 'none',
        lineStyle: {
          normal: { opacity: 0.8, width: 1, color: ma30Color },
        },
      },
      {
        name: 'Volumn',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: data.vols,
        barWidth: '60%',
        itemStyle: {
          normal: {
            color: function (params) {
              var colorList;
              if (
                data.datas[params.dataIndex][1] >
                data.datas[params.dataIndex][0]
              ) {
                colorList = upColor;
              } else {
                colorList = downColor;
              }
              return colorList;
            },
          },
        },
      },
      {
        name: 'MACD',
        type: 'bar',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: macd.macd,
        barWidth: '40%',
        itemStyle: {
          normal: {
            color: function (params) {
              var colorList;
              if (params.data >= 0) {
                colorList = upColor;
              } else {
                colorList = downColor;
              }
              return colorList;
            },
          },
        },
      },
      {
        name: 'DIF',
        type: 'line',
        symbol: 'none',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: macd.dif,
        lineStyle: { normal: { color: '#da6ee8', width: 1 } },
      },
      {
        name: 'DEA',
        type: 'line',
        symbol: 'none',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: macd.dea,
        lineStyle: {
          normal: { opacity: 0.8, color: '#39afe6', width: 1 },
        },
      },
    ],
  };
}

/*
 * @Author: czy0729
 * @Date: 2019-09-01 13:55:54
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-09-02 14:31:28
 */
const defaultDistance = 60 * 60 * 1000 * 4

/**
 * 时间格式化
 * @param {*} format
 * @param {*} date
 */
function dateFormat(format, date) {
  let _format = format
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds() // 毫秒
  }

  if (/(y+)/.test(format)) {
    _format = _format.replace(
      RegExp.$1,
      String(date.getFullYear()).substr(4 - RegExp.$1.length)
    )
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const k in o) {
    if (new RegExp(`(${k})`).test(_format)) {
      _format = _format.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : `00${o[k]}`.substr(String(o[k]).length)
      )
    }
  }
  return _format
}

/**
 * 获取指定格式的时间字符串
 * @param {*} date
 */
function getDateFormat(date) {
  return dateFormat('MM-dd hh:mm', new Date(date))
}

/**
 * 获取时间间隔的首个时间
 * @param {*} formatDate
 */
function getStartDate(formatDate) {
  return `${formatDate.substring(0, 11)}00:00${formatDate.substring(16)}`
}

/**
 * 补原始数据, 以便分组合并
 * @param {*} data
 */
function insertOrigin(data) {
  const _data = JSON.parse(JSON.stringify(data))
  _data[0].Amount = 0
  return [
    {
      ..._data[0],
      Time: new Date(getStartDate(data[0].Time)).getTime(),
      Begin: 0,
      End: 0,
      Low: 0,
      High: 0,
      Amount: 0,
      Price: 0
    },
    ..._data
  ]
}

/**
 * 按时间间隔对数据进行分组
 * @param {*} params
 */
function group(data, distance = defaultDistance) {
  const result = []
  const start = new Date(data[0].Time).getTime()
  let lastIndex = 0

  data.forEach(item => {
    const timestamp = new Date(item.Time).getTime()
    const index = parseInt((timestamp - start) / distance)
    let empty = index - lastIndex - 1
    if (empty < 0) {
      empty = 0
    }
    if (!result[index]) {
      result[index] = {
        Time: start + index * distance,
        Empty: empty,
        data: []
      }
      lastIndex = index
    }
    result[index].data.push(item)
  })

  return result
}

/**
 * 分组合并
 */
function mergeGroup(data) {
  const result = []
  data.forEach(item => {
    const merge = {
      Time: item.Time,
      Empty: item.Empty,
      Begin: item.data[item.data.length - 1].End,
      End: item.data[0].Begin,
      Low: undefined,
      High: undefined,
      Amount: 0
    }

    item.data.forEach(i => {
      if (merge.Low === undefined) {
        merge.Low = i.Low
      } else if (i.Low < merge.Low) {
        merge.Low = i.Low
      }

      if (merge.High === undefined) {
        merge.High = i.High
      } else if (i.High > merge.High) {
        merge.High = i.High
      }

      merge.Amount += i.Amount
    })

    result.push(merge)
  })

  return result
}

/**
 * 生成K线数据
 * @param {*} data
 * @param {*} distance
 */
function kLineData(data, distance = defaultDistance) {
  const result = []
  data.forEach(item => {
    if (item.Empty) {
      for (let i = 0; i < item.Empty; i += 1) {
        const ref = [...result[result.length - 1]]
        ref[0] += distance
        result.push([
          ref[0],
          item.End,
          item.End,
          item.End,
          item.End,
          0
        ])
      }
    }

    result.push([
      item.Time,
      item.End,
      item.Begin,
      item.Low,
      item.High,
      item.Amount
    ])
  })

  // eslint-disable-next-line no-param-reassign
  result.forEach(item => (item[0] = getDateFormat(item[0])))
  return result
}

/**
 * 获取KData
 * 数据长度过大会影响性能, 需要截取
 * @param {*} data
 * @param {*} distance
 */
function getKData(data = [], distance = defaultDistance) {
  if (!data.length) {
    return []
  }
  const kdata = kLineData(
    mergeGroup(group(insertOrigin(data), distance)),
    distance
  )
  if (kdata.length < 500) {
    return kdata
  }
  return kdata.slice(kdata.length - 500)
}

function loadTinyBox(id, callback) {
  getData(`chara/${id}`, function (d, s) {
    if (d.State === 0) {
      var item = d.Value;
      var pre = caculateICO(item);
      if (item.CharacterId) {
        var percent = formatNumber(item.Total / pre.Next * 100, 0);
        $('#pageHeader').append(`<button id="openTradeButton" class="tag lv${pre.Level}" title="${formatNumber(item.Total, 0)}/100,000">ICO进行中 ${percent}%</button>`);
        $('#openTradeButton').on('click', function () {
          $('#grailBox').remove();
          $("#subject_info .board").after(`<div id="grailBox" class="chara${id}"><div class="loading"></div></div>`);
          loadICOBox(item);
        });
      } else {
        $('#pageHeader a.avatar>img').attr('src', normalizeAvatar(d.Value.Icon));
        $('#pageHeader a.avatar>img').css('width', '50px');
        var flu = '--';
        var tclass = 'even';
        if (item.Fluctuation > 0) {
          tclass = 'raise';
          flu = `+ ${formatNumber(item.Fluctuation * 100, 2)
            }% `;
        } else if (item.Fluctuation < 0) {
          tclass = 'fall';
          flu = `${formatNumber(item.Fluctuation * 100, 2)}% `;
        }
        $('#pageHeader').append(`<button id="openTradeButton" class="tag ${tclass}" title ="₵${formatNumber(item.MarketValue, 0)} / ${formatNumber(item.Total, 0)}">₵${formatNumber(item.Current, 2)} ${flu}</button>`);
        $('#openTradeButton').on('click', function () {
          $('#grailBox').remove();
          $("#subject_info .board").after(`<div id="grailBox" class="chara${id}"><div class="loading"></div></div>`);
          loadTradeBox(item);
        });
      }
      if (callback) callback(item);
    } else {
      $('#pageHeader').append(`<button id="openTradeButton" class="tag active">启动ICO</button>`);
      $('#openTradeButton').on('click', function () {
        $('#grailBox').remove();
        $("#subject_info .board").after(`<div id="grailBox" class="chara${id}"><div class="loading"></div></div>`);
        beginICO(id);
      });
    }
  });
}

function loadICOBox(ico) {
  var predicted = caculateICO(ico);
  var end = new Date(new Date(ico.End) - (new Date().getTimezoneOffset() + 8 * 60) * 60 * 1000);
  var percent = Math.round(ico.Total / predicted.Next * 100);
  var p = percent > 100 ? 100 : percent;
  percent = formatNumber(percent, 0);
  var predictedBox = '';
  if (predicted.Level > 0)
    predictedBox = `<div class="predicted"><div class="tag lv${predicted.Level}">level ${predicted.Level}</div>预计发行量：约${formatNumber(predicted.Amount, 0)} 股 | 发行价：₵${formatNumber(predicted.Price, 2)}</div>`;

  var badge = '';
  if (ico.Type === 1)
    badge = `<span class="badge new" title="剩余${ico.Bonus}期额外分红">×${ico.Bonus}</span>`;

  var goal = `成功上市还需要`;
  if (predicted.Level > 0)
    goal = '下一等级还需要';

  var users = `${predicted.Users}名参与者`;
  if (predicted.Users <= 0)
    users = '';

  var money = `投入₵${formatNumber(predicted.Next - ico.Total, 0)}`;
  if (predicted.Next - ico.Total <= 0)
    money = '';

  var rest = `${goal}${users}${money}`;

  var box = `<div class="title"><div class="text">#${ico.CharacterId} -「${ico.Name}」 ICO进行中${badge}</div> <div class="balance"></div></div>
      <div class="desc">
        <div class="bold">已筹集 ₵${formatNumber(ico.Total, 0)} / <span class="sub">${rest}</span></div>
        <div class="sub">剩余时间：<span id="day"></span><span id="hour"></span><span id="minute"></span><span id="second"></span></div>
      </div>
    ${ predictedBox}
    <div class="progress_bar"><div class="progress" style="width:${p}%">${percent}%</div></div>`
  $('#grailBox').html(box);
  $('#grailBox').addClass('chara' + ico.CharacterId);
  countDown('#grailBox.chara' + ico.CharacterId, end, function () { loadGrailBox(cid); });

  getInitialUsers(ico.Id, 1, function (d, s) {
    if (d.State === 0) {
      if (d.Value.TotalItems > 0) {
        var desc = `<div class="desc"><div class="bold">参与者 ${d.Value.TotalItems} / <span class="sub">${ico.Users + predicted.Users}</span></div></div><div class="users"></div>`;
        $('#grailBox').append(desc);
        for (i = 0; i < d.Value.Items.length; i++) {
          var icu = d.Value.Items[i];
          var index = (d.Value.CurrentPage - 1) * 10 + i;
          var user = RenderInitialUser(icu, index);
          $("#grailBox .users").append(user);
        }
        if (d.Value.TotalPages > 1) {
          var loadMore = `<div class="center_button"><button id="loadICOUserButton" class="load_more_button">[加载更多...]</button></div>`
          $("#grailBox .users").after(loadMore);
          $("#loadICOUserButton").data('page', 2);
          $("#loadICOUserButton").on('click', function (e) {
            var page = $(e.currentTarget).data('page');
            getInitialUsers(ico.Id, page, function (d, s) {
              if (d.State === 0) {
                for (i = 0; i < d.Value.Items.length; i++) {
                  var icu = d.Value.Items[i];
                  var index = (d.Value.CurrentPage - 1) * 10 + i;
                  var user = RenderInitialUser(icu, index);
                  $("#grailBox .users").append(user);
                }
              }
              $(e.currentTarget).data('page', page + 1);
              if (d.Value.CurrentPage >= d.Value.TotalPages)
                $(e.currentTarget).parents('.center_button').hide();
              //$(".center_button").hide();
            });
          });
        }
      }
    }

    getUserAssets(function (d, s) {
      if (d.State === 0) {
        var balance = `账户余额：<span>₵${formatNumber(d.Value.Balance, 2)}</span>`;
        $('.title .balance').html(balance);
        getUserInitial(ico.Id, function (d, s) {
          var text = '追加注资请在下方输入金额';
          if (d.State === 0) {
            text = `已注资₵${formatNumber(d.Value.Amount, 2)} ，${text} `;
          }
          var trade = `<div class="desc">${text}</div>
      <div class="trade"><input class="money" type="number" min="5000" value="5000"></input><button id="appendICOButton" class="active">确定</button><button id="cancelICOButton">取消</button></div>`;
          $('#grailBox').append(trade);
          $('#appendICOButton').on('click', function () { appendICO(ico.Id) });
          $('#cancelICOButton').on('click', function () { cancelICO(ico.Id) });
        });
      } else {
        addLoginButton($('.title .balance'), function () {
          loadICOBox(ico);
        });
      }
    });
  });
}

function RenderInitialUser(icu, index) {
  var avatar = normalizeAvatar(icu.Avatar);
  var amount = formatNumber(icu.Amount, 0);
  if (icu.Amount == 0)
    amount = '???';

  var badge = renderUserBadge(icu);

  var user = `<div class="user">
      <a class="avatar" target="_blank" href="/user/${icu.Name}" style="background-image:url(${avatar})">${badge}</a>
        <div class="name">
          <a target="_blank" href="/user/${icu.Name}"><span class="title">${index + 1}</span>${icu.NickName}</a>
          <div class="tag board">+${amount}</div>
        </div></div>`;

  return user;
}

function login(callback) {
  window.addEventListener('message', function (e) {
    if (e.data === "reloadEditBox") {
      getBangumiBonus();
      callback();
    }
  });
  var login = 'https://bgm.tv/oauth/authorize?response_type=code&client_id=bgm2525b0e4c7d93fec&redirect_uri=https%3A%2F%2Ftinygrail.com%2Fapi%2Faccount%2Fcallback';
  window.open(login);
}

function logout(callback) {
  postData('account/logout', null, callback);
}

function normalizeAvatar(avatar) {
  if (!avatar) return '//lain.bgm.tv/pic/user/l/icon.jpg';

  if (avatar.startsWith('https://tinygrail.oss-cn-hangzhou.aliyuncs.com/'))
    return cdn + avatar.substr(46) + '!w120';
  else if (avatar.startsWith('/avatar'))
    return cdn + avatar + '!w120';

  var a = avatar.replace("http://", "//");

  // var index = a.indexOf("?");
  // if (index >= 0)
  //   a = a.substr(0, index);

  return a;
}

function addLoginButton(parent, callback) {
  var button = `<button id="loginButton" class="active">开启交易</button>`;
  parent.html(button);
  $('#loginButton').on('click', function () { login(callback) });
}

function getUserAssets(callback) {
  getData('chara/user/assets', callback);
}

function getGameMaster(callback) {
  getData('chara/user/assets', (d) => {
    if (d.State == 0 && (d.Value.Type >= 999 || d.Value.Id == 702)) {
      if (callback) callback(d.Value);
    }
  });
}

function getUserInitial(id, callback) {
  getData(`chara/initial/${id}`, function (d, s) {
    callback(d, s);
  });
}

function getInitialUsers(id, page, callback) {
  getData(`chara/initial/users/${id}/${page}`, function (d, s) {
    callback(d, s);
  });
}

function beginICO(id) {
  getUserAssets(function (d, s) {
    if (d.State == 0) {
      var name = getCharacterName();
      var box = `<div class="title"><div class="text">#${id} -「${name}」 ICO启动程序</div><div class="balance">账户余额：<span>₵${formatNumber(d.Value.Balance, 2)}</span></div></div>
        <div class="desc">输入注资金额，点击“确定”完成ICO启动</div>
        <div class="trade"><input class="money" type="number" min="10000" value="10000"></input><button id="completeICOButton" class="active">确定</button><button id="cancelICOButton">取消</button></div>`;
      $('#grailBox').html(box);
      $('#completeICOButton').on('click', function () { completeICO(id) });
      $('#cancelICOButton').on('click', function () { cancelICO(id) });
    } else {
      login(function () {
        beginICO(id);
      })
    }
  });
}

function cancelICO(id) {
  $('#grailBox').remove();
  if (!path.startsWith('/rakuen'))
    loadGrailBox(cid);
}

function completeICO(id) {
  if (!confirm("项目启动之后将不能主动退回资金直到ICO结束，确定要启动ICO？")) return;

  $('#completeICOButton').attr('disabled', true);
  $('#cancelICOButton').attr('disabled', true);
  var offer = $('#grailBox .money').val();

  postData(`chara/init/${id}/${offer}`, null, function (d, s) {
    if (d.State == 0) {
      alert('ICO启动成功，邀请更多朋友加入吧。');
      loadICOBox(d.Value);
    } else {
      alert(d.Message);
      $('#completeICOButton').removeAttr('disabled');
      $('#cancelICOButton').removeAttr('disabled');
    }
  });
}

function appendICO(id) {
  if (!confirm("除非ICO启动失败，注资将不能退回，确定参与ICO？")) return;

  var offer = $('#grailBox .money').val();
  postData(`chara/join/${id}/${offer}`, null, function (d, s) {
    if (d.State === 0) {
      alert('追加注资成功。');
      loadGrailBox(cid);
    } else {
      alert(d.Message);
    }
  });
}

function getBangumiBonus(callback) {
  getData(`event/bangumi/bonus`, function (d, s) {
    if (d.State == 0)
      alert(d.Value);

    if (callback) callback();
  });
}

function getDailyBangumiBonus(callback) {
  //if (!confirm('请注意，领取签到奖励之后本周将不能再领取股息分红。')) return;
  getData(`event/bangumi/bonus/daily`, function (d, s) {
    if (d.State == 0)
      alert(d.Value);
    else
      alert(d.Message);

    callback();
  });
}

function getWeeklyShareBonus(callback) {
  //if (!confirm('请注意，领取股息分红之后本周将不能再领取登录奖励，股息预测小于₵10,000建议每日签到。')) return;
  getData(`event/share/bonus`, function (d, s) {
    if (d.State == 0)
      alert(d.Value);
    else
      alert(d.Message);

    callback();
  });
}

function getHolidayBonus(callback) {
  getData(`event/holiday/bonus`, function (d, s) {
    if (d.State == 0)
      alert(d.Value);
    else
      alert(d.Message);

    callback();
  });
}

function getCharacterName() {
  var name = $('.nameSingle small').text();
  if (!name)
    name = $('.nameSingle a').text();
  if (!name)
    name = $('#pageHeader a.avatar').attr('title');
  return name;
}

function getData(url, callback) {
  if (!url.startsWith('http'))
    url = api + url;
  $.ajax({
    url: url,
    type: 'GET',
    xhrFields: { withCredentials: true },
    success: callback
  });
}

function postData(url, data, callback) {
  var d = JSON.stringify(data);
  if (!url.startsWith('http'))
    url = api + url;
  $.ajax({
    url: url,
    type: 'POST',
    contentType: 'application/json',
    data: d,
    xhrFields: { withCredentials: true },
    success: callback
  });
}

function formatNumber(number, decimals, dec_point, thousands_sep) {
  number = (number + '').replace(/[^0-9+-Ee.]/g, '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 2 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    // toFixedFix = function (n, prec) {
    //   var k = Math.pow(10, prec);
    //   return '' + Math.ceil(n * k) / k;
    // };

    //s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    s = (prec ? n.toFixed(prec) : '' + Math.round(n)).split('.');
  var re = /(-?\d+)(\d{3})/;
  while (re.test(s[0])) {
    s[0] = s[0].replace(re, "$1" + sep + "$2");
  }

  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1).join('0');
  }
  return s.join(dec);
}

function countDown(target, end, callback) {
  var now = new Date();
  var times = (end - now) / 1000;
  var timer = setInterval(function () {
    if ($(target).length == 0) {
      clearInterval(timer);
      return;
    }

    var day = 0;
    var hour = 0;
    var minute = 0;
    var second = 0;
    if (times > 0) {
      day = Math.floor(times / (60 * 60 * 24));
      hour = Math.floor(times / (60 * 60)) - (day * 24);
      minute = Math.floor(times / 60) - (day * 24 * 60) - (hour * 60);
      second = Math.floor(times) - (day * 24 * 60 * 60) - (hour * 60 * 60) - (minute * 60);
    }
    // if (day <= 9) day = '0' + day;
    // if (hour <= 9) hour = '0' + hour;
    // if (minute <= 9) minute = '0' + minute;
    // if (second <= 9) second = '0' + second;

    $(`${target} span#day`).text(day + '天');
    $(`${target} span#hour`).text(hour + '时');
    $(`${target} span#minute`).text(minute + '分');
    $(`${target} span#second`).text(second + '秒');

    now = new Date();
    times = (end - now) / 1000;
  }, 1000)
  if (times <= 0) {
    clearInterval(timer);
    callback();
  }
}

function getTimeDiff(timeStr) {
  var now = new Date();
  var time = new Date(timeStr) - (new Date().getTimezoneOffset() + 8 * 60) * 60 * 1000;
  return now - time;
}

function formatTime(timeStr) {
  var now = new Date();
  var time = new Date(timeStr) - (new Date().getTimezoneOffset() + 8 * 60) * 60 * 1000;

  var times = (time - now) / 1000;
  var day = 0;
  var hour = 0;
  var minute = 0;
  var second = 0;
  if (times > 0) {
    day = Math.floor(times / (60 * 60 * 24));
    hour = Math.floor(times / (60 * 60)) - (day * 24);

    if (day > 0)
      return `${day}天${hour}小时`;
    else if (hour > 12)
      return `剩余${hour}小时`;

    return '即将结束';
  } else {
    times = Math.abs(times);
    day = Math.floor(times / (60 * 60 * 24));
    hour = Math.floor(times / (60 * 60));
    minute = Math.floor(times / 60);
    second = Math.floor(times);

    if (minute < 1) {
      return `${second}s ago`;
    } else if (minute < 60) {
      return `${minute}m ago`;
    } else if (hour < 24) {
      return `${hour}h ago`;
    }

    if (day > 1000)
      return 'never';

    return `${day}d ago`;
  }
}

function formatDate(date) {
  var date = new Date(date);
  return date.format('yyyy-MM-dd hh:mm:ss');
}

Date.prototype.format = function (format) {
  var o = {
    'M+': this.getMonth() + 1, // month
    'd+': this.getDate(), // day
    'h+': this.getHours(), // hour
    'm+': this.getMinutes(), // minute
    's+': this.getSeconds(), // second
    'q+': Math.floor((this.getMonth() + 3) / 3), // quarter
    'S': this.getMilliseconds() // millisecond
  };
  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1,
      (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(RegExp.$1,
        RegExp.$1.length == 1 ? o[k]
          : ('00' + o[k]).substr(('' + o[k]).length));
    }
  }
  return format;
}

function loadUserPage(name) {
  var title = $('title').text();
  if (title != '我的时光机')
    title = title.substr(0, title.length - 4) + '的小圣杯';
  else
    title = '我的小圣杯';

  loadSendButton();
  getData(`chara/user/assets/${name}`, function (d, s) {
    if (d.State === 0) {
      var data = d.Value;
      $('h1.nameSingle .inner small.grey').after(`<button id="recommendButton" class="text_button">[推荐关系]</button><button id="sendLogButton" class="text_button">[红包记录]</button>`);
      $('#recommendButton').on('click', (e) => {
        openRecommendDialog(d.Value.Id, name);
      });
      $('#sendLogButton').on('click', (e) => {
        openSendLogDialog(data);
      });

      if (data.State == 666)
        $('h1.nameSingle .inner small.grey').after('<small class="red">[小圣杯已封禁]</small>');

      if (data.LastIndex != 0) {
        var badge = `<span class="badge" title="「小圣杯」排名第${data.LastIndex}位">#${data.LastIndex}</span>`;
        $('#headerProfile .headerAvatar').append(badge);
      }

      getGameMaster((result) => {
        if (result) {
          if (result.Id == 702) {
            $('h1.nameSingle .inner small.grey').after(`<button id="logButton" class="text_button">[资金日志]</button>`);
            $('#logButton').on('click', (e) => {
              var nickname = $('.nameSingle .inner a').text();
              openUserLogDialog(name, nickname);
            });
          }

          $('h1.nameSingle .inner small.grey').after(`<button id="tradeLogButton" class="text_button">[交易记录]</button>`);
          $('#tradeLogButton').on('click', (e) => {
            var nickname = $('.nameSingle .inner a').text();
            data.Name = name;
            data.Nickname = nickname;
            openUserHistoryDialog(data);
          });

          $('h1.nameSingle .rr').append(`<a href="#" id="banUserButton" class="chiiBtn"><span>封禁</span></a>`);
          $('#banUserButton').on('click', (e) => {
            if (!confirm('封禁之后只有管理员才能解除，确认要封禁用户？'))
              return;
            postData(`chara/user/ban/${name}`, null, (d) => {
              if (d.State == 0) {
                alert('封禁用户成功。');
                window.location.reload();
              } else {
                alert(d.Message);
              }
            });
          });

          $('h1.nameSingle .rr').append(`<a href="#" id="unbanUserButton" class="chiiBtn"><span>解封</span></a>`);
          $('#unbanUserButton').on('click', (e) => {
            if (!confirm('确认要解除封禁用户？'))
              return;
            getData(`chara/user/unban/${name}`, (d) => {
              if (d.State == 0) {
                alert('解除封禁成功。');
                window.location.reload();
              } else {
                alert(d.Message);
              }
            });
          });
        }
      });

      var box = `<div id="grail" class="sort" data-id="${d.Value.Id}">
      <div class="horizontalOptions clearit">
        <ul class="">
          <li class="title"><h2>${title} </h2></li>
          <li id="linkTab" data-target=".link_list" data-pager="#pager0" class="current grail_user_tab"><a>0组连接</a></li>
          <li id="templeTab" data-target=".temple_list" data-pager="#pager1" class="grail_user_tab"><a>0座圣殿</a></li>
          <li id="charaTab" data-target=".chara_list" data-pager="#pager2" class="grail_user_tab"><a>0个人物</a></li>
          <li id="initTab" data-target=".init_list" data-pager="#pager3" class="grail_user_tab"><a>0个ICO</a></li>
          <li class="total"></li>
        </ul>
      </div>
      <div class="clearit">
        <div class="link_list grail_user_list">
          <div class="loading"></div>
        </div>
        <div class="temple_list grail_user_list" style="display:none">
          <div class="loading"></div>
        </div>
        <div class="chara_list grail_user_list" style="display:none">
          <div class="loading"></div>
        </div>
        <div class="init_list grail_user_list" style="display:none">
          <div class="loading"></div>
        </div>
      </div>
      </div>`;
      $('#user_home .user_box').after(box);

      loadUserLinks(1, (list) => {
        if (!list || list.length == 0) {
          $('#templeTab').click();
        }
      });
      loadUserTemples(1);
      loadUserCharacters(1);
      loadUserInitials(1);

      $('body').on('click', '.temple_list .item .title', characterNameClicked);
      $('body').on('click', '.link .content span', characterNameClicked);

      $('#grail .total').text(`总资产：₵${formatNumber(data.Assets, 2)} / ${formatNumber(data.Balance, 2)}`);

      $('.grail_user_tab').on('click', function (e) {
        switchUserTab(e);
      });
    }
  });
}

function switchUserTab(e) {
  $('.grail_user_tab').removeClass('current');
  $(e.currentTarget).addClass('current');

  var target = $(e.currentTarget).data('target');
  $('.grail_user_list').hide();
  $(target).show();

  var pager = $(e.currentTarget).data('pager');
  $('.grail.page_inner').hide();
  $(pager).show();
}

function loadUserLinks(page, callback) {
  $('#grail .link_list .grail_list').hide();

  var p = $(`#grail .link_list .grail_list.page${page}`);
  if (p.length > 0) {
    p.show();
    $('#pager0 .p').removeClass('p_cur');
    $(`#pager0 .p[data-page=${page}]`).addClass('p_cur');
    p.show();
    return;
  }

  $('#grail .link_list .loading').show();

  var userId = $('#grail').data('id');
  var userName = path.split('?')[0].substr(6);
  var list = `<ul class="grail_list page${page}"></ul>`;
  $('.link_list').append(list);

  postData(`chara/user/link/${userName}/${page}/12`, null, (data) => {
    $('#grail .link_list .loading').hide();
    if (data.State == 0) {
      $('#linkTab a').text(`${data.Value.TotalItems}组连接`);
      if (data.Value.Items) {
        for (i = 0; i < data.Value.Items.length; i++) {
          var temple = data.Value.Items[i];
          var item = renderLink(temple, temple.Link);
          if (item != null) {
            var sacrifices = Math.min(temple.Assets, temple.Link.Assets);
            $(`#grail .link_list .page${page}`).append(`<div class="link">${item}<div class="name sub">+${formatNumber(sacrifices, 0)}</div></div>`);
            $(`#grail .link_list .item .card[data-id="${temple.CharacterId}"]`).data('temple', temple);
            $(`#grail .link_list .item .card[data-id="${temple.Link.CharacterId}"]`).data('temple', temple.Link);
          }
        }
      }

      $(`#grail .link_list .page${page} .item .card`).on('click', templeCardClicked);

      if (data.Value.TotalPages > 1) {
        loadPager(data.Value.TotalPages, page, 'grail', 'pager0', loadUserLinks);
        if ($('.link_list').css('display') == 'none')
          $('#pager0').hide();
      }

      if (callback) callback(data.Value.Items);
    }
  });
}

function loadUserTemples(page) {
  $('#grail .temple_list .grail_list').hide();

  var p = $(`#grail .temple_list .grail_list.page${page}`);
  if (p.length > 0) {
    p.show();
    $('#pager1 .p').removeClass('p_cur');
    $(`#pager1 .p[data-page=${page}]`).addClass('p_cur');
    p.show();
    return;
  }

  $('#grail .temple_list .loading').show();

  var userId = $('#grail').data('id');
  var userName = path.split('?')[0].substr(6);
  var list = `<ul class="grail_list page${page}"></ul>`;
  $('.temple_list').append(list);

  postData(`chara/user/temple/${userName}/${page}/24`, null, (data) => {
    $('#grail .temple_list .loading').hide();
    if (data.State == 0) {
      $('#templeTab a').text(`${data.Value.TotalItems}座圣殿`);

      for (i = 0; i < data.Value.Items.length; i++) {
        var temple = data.Value.Items[i];
        var item = renderTemple(temple, 'mine');
        $(`#grail .temple_list .page${page}`).append(item);
        $(`#grail .temple_list .card[data-id="${temple.UserId}#${temple.CharacterId}"]`).data('temple', temple);
      }

      $(`#grail .temple_list .page${page} .item .card`).on('click', (e) => {
        var temple = $(e.currentTarget).data('temple');
        showTemple(temple, null);
      });

      if (data.Value.TotalPages > 1) {
        loadPager(data.Value.TotalPages, page, 'grail', 'pager1', loadUserTemples);
        if ($('.temple_list').css('display') == 'none')
          $('#pager1').hide();
      }
    }
  });
}

function loadUserCharacters(page) {
  $('#grail .chara_list .grail_list').hide();

  var p = $(`#grail .chara_list .grail_list.page${page}`);
  if (p.length > 0) {
    p.show();
    $('#pager2 .p').removeClass('p_cur');
    $(`#pager2 .p[data-page=${page}]`).addClass('p_cur');
    p.show();
    return;
  }

  $('#grail .chara_list .loading').show();

  var userId = $('#grail').data('id');
  var userName = path.split('?')[0].substr(6);
  var list = `<ul class="grail_list page${page}"></ul>`;
  $('.chara_list').append(list);

  postData(`chara/user/chara/${userName}/${page}/48`, null, (data) => {
    $('#grail .chara_list .loading').hide();
    if (data.State == 0) {
      $('#charaTab a').text(`${data.Value.TotalItems}个人物`);

      for (i = 0; i < data.Value.Items.length; i++) {
        var item = renderUserCharacter(data.Value.Items[i]);
        $(`#grail .chara_list .page${page}`).append(item);
      }

      if (data.Value.TotalPages > 1) {
        loadPager(data.Value.TotalPages, page, 'grail', 'pager2', loadUserCharacters);
        if ($('.chara_list').css('display') == 'none')
          $('#pager2').hide();
      }
    }
  });
}

function loadUserInitials(page) {
  $('#grail .init_list .grail_list').hide();

  var p = $(`#grail .init_list .grail_list.page${page}`);
  if (p.length > 0) {
    p.show();
    $('#pager3 .p').removeClass('p_cur');
    $(`#pager3 .p[data-page=${page}]`).addClass('p_cur');
    p.show();
    return;
  }

  $('#grail .init_list .loading').show();

  var userId = $('#grail').data('id');
  var userName = path.split('?')[0].substr(6);
  var list = `<ul class="grail_list page${page}"></ul>`;
  $('.init_list').append(list);

  postData(`chara/user/initial/${userName}/${page}/48`, null, (data) => {
    $('#grail .init_list .loading').hide();
    if (data.State == 0) {
      $('#initTab a').text(`${data.Value.TotalItems}个ICO`);

      for (i = 0; i < data.Value.Items.length; i++) {
        var item = renderUserInitial(data.Value.Items[i]);
        $(`#grail .init_list .page${page}`).append(item);
      }

      if (data.Value.TotalPages > 1) {
        loadPager(data.Value.TotalPages, page, 'grail', 'pager3', loadUserInitials);
        if ($('.init_list').css('display') == 'none')
          $('#pager3').hide();
      }
    }
  });
}

function renderUserInitial(initial) {
  var amount = formatNumber(initial.State, 0);
  if (initial.State == 0)
    amount = '???';

  var item = `<li><a href="/character/${initial.CharacterId}" target="_blank" class="avatar"><span class="groupImage"><img src="${normalizeAvatar(initial.Icon)}"></span></a>
          <div class="inner"><a href="/character/${initial.CharacterId}" target="_blank" class="avatar name">${initial.Name}</a><br>
            <small class="feed">₵${amount} / ${formatNumber(initial.Total, 0)}</small></div></li>`;
  return item;
}

function renderUserCharacter(chara) {
  var title = `₵${formatNumber(chara.Current, 2)} / +${formatNumber(chara.Fluctuation * 100, 2)}%`;
  if (chara.Fluctuation <= 0)
    title = `₵${formatNumber(chara.Current, 2)} / ${formatNumber(chara.Fluctuation * 100, 2)}%`;

  var amount = formatNumber(chara.State, 0);
  if (chara.State == 0)
    amount = "--";

  var item = `<li title="${title}"><a href="/character/${chara.Id}" target="_blank" class="avatar"><span class="groupImage"><img src="${normalizeAvatar(chara.Icon)}"></span></a>
      <div class="inner"><a href="/character/${chara.Id}" target="_blank" class="avatar name">${chara.Name}</a><br>
        <small class="feed" title="持股数量 / 固定资产">${amount} / ${formatNumber(chara.Sacrifices, 0)}</small></div></li>`;
  return item;
}

function renderInitial(item, index) {
  var predicted = caculateICO(item);
  var percent = formatNumber(item.Total / predicted.Next * 100, 0);
  var p = percent > 100 ? 100 : percent;

  var badge = '';
  if (item.Type === 1)
    badge = `<span class="badge" title="剩余${item.Bonus}期额外分红">×${item.Bonus}</span>`;

  var box = `<li class="initial_item initial"><a data-id="${item.CharacterId}" class="avatar"><img src="${normalizeAvatar(item.Icon)}">${badge}</a>
        <div class="info"><div class="name"><a target="_blank" href="/character/${item.CharacterId}">${index + 1}. ${item.Name}</a></div><div class="money">₵${formatNumber(item.Total, 0)} / ${formatNumber(item.Users, 0)}人</div>
          <div class="progress"><div style="width:${p}%" class="tag lv${predicted.Level}">lv${predicted.Level} ${percent}%</div></div>
          <div class="time">${formatTime(item.End)}</div>
        </div></li>`;
  return box;
}

function renderUser(item, index) {
  var flu = '-';
  var tclass = 'even';
  if (item.LastIndex > index + 1) {
    tclass = 'raise';
    flu = `+${item.LastIndex - index - 1}`;
  } else if (item.LastIndex < index + 1) {
    tclass = 'fall';
    flu = `${item.LastIndex - index - 1}`;
  }

  if (item.LastIndex === 0) {
    tclass = "new";
    flu = "new";
  }

  var banned = '';
  var name = item.Name;
  if (item.State == 666) {
    banned = 'banned';
    name += '(被封禁)';
  }

  item.LastIndex = index + 1;
  var badge = renderUserBadge(item);
  var avatar = normalizeAvatar(item.Avatar);

  var box = `<li class="initial_item user ${banned}"><a target="right" href="/user/${item.Name}" class="avatar"><img src="${avatar}">${badge}</a>
          <div class="info"><div class="name" title="${name}"><a target="_blank" href="/user/${item.Name}">${item.Nickname}</a><span class="tag ${tclass}">${flu}</span></div><div class="money" title="每周股息 / 流动资金 / 初始资金">+₵${formatNumber(item.Share, 0)} / ₵${formatNumber(item.TotalBalance, 0)} / ${formatNumber(item.Principal, 0)}</div>
            <div class="current ${tclass}" title="总资产">₵${formatNumber(item.Assets, 0)}</div>
            <div class="time"><small>${formatTime(item.LastActiveDate)}</small></div></div></li>`;
  return box;
}

function renderUserBadge(item) {
  var badge = '';
  if (item.LastIndex != 0)
    badge = `<span class="badge" title="排名第${item.LastIndex}位">#${item.LastIndex}</span>`;
  return badge;
}

function renderCharacter(item, index) {
  var flu = '0.00';
  var tclass = 'even';
  if (item.Fluctuation > 0) {
    tclass = 'raise';
    flu = `+${formatNumber(item.Fluctuation * 100, 2)}%`;
  } else if (item.Fluctuation < 0) {
    tclass = 'fall';
    flu = `${formatNumber(item.Fluctuation * 100, 2)}%`;
  }
  var depth = renderCharacterDepth(item);
  var badge = renderBadge(item, false, true, true);
  var badge2 = renderBadge(item, true, false, false);

  var box = `<li class="initial_item chara"><a target="right" class="avatar" data-id="${item.Id}"><img src="${normalizeAvatar(item.Icon)}">${badge}</a>
            <div class="info"><div class="name" title="${item.Name}"><a target="_blank" href="/character/${item.Id}"><span>${index + 1}.</span>${item.Name}</a>${badge2}</div><div class="money" title="股息 / 总股份 / 总市值">+${formatNumber(item.Rate, 2)} / ${formatNumber(item.Total, 0)} / ₵${formatNumber(item.MarketValue, 0)}</div>
              <div class="current ${tclass}" title="现价 / 涨跌">₵${formatNumber(item.Current, 2)}<span class="tag ${tclass}">${flu}</span></div>
              <div class="time" title="买入 / 卖出 / 成交量"><small>${formatTime(item.LastOrder)}</small>${depth}</div></div></li>`;
  return box;
}

function renderBadge(item, withCrown, withNew, withLevel) {
  var badge = '';

  if (withLevel)
    badge = `<span class="badge level lv${item.Level}">lv${item.Level}</span>`;

  if (item.Type == 1 && withNew) {
    badge += `<span class="badge new" title="+${formatNumber(item.Rate, 1)}新番加成剩余${item.Bonus}期">×${item.Bonus}</span>`;
  }

  if (item.State > 0 && withCrown)
    badge += `<span class="badge crown" title="获得${item.State}次萌王">×${item.State}</span>`;

  return badge;
}

function renderCharacter3(item, index, auction) {
  var flu = '0.00';
  var tclass = 'even';
  if (item.Fluctuation > 0) {
    tclass = 'raise';
    flu = `+${formatNumber(item.Fluctuation * 100, 2)}%`;
  } else if (item.Fluctuation < 0) {
    tclass = 'fall';
    flu = `${formatNumber(item.Fluctuation * 100, 2)}%`;
  }

  var time = '';
  if (auction)
    time = `<div class="time"><button class="auction_button" data-id="${item.Id}">[出价]</button><button class="history_button" data-id="${item.Id}">[上周]</button></div>`;

  var badge = renderBadge(item, false, false, true);
  var box = `<li class="initial_item chara"><a target="right" class="avatar" data-id="${item.Id}"><img src="${normalizeAvatar(item.Icon)}">${badge}</a>
              <div class="info"><div class="name" title="${item.Name}"><a target="_blank" href="/character/${item.Id}"><span>${index + 1}.</span>${item.Name}</a></div><div class="money" title="股息 / 底价 / 数量">+${formatNumber(item.Rate, 2)} / ₵${formatNumber(item.Price, 0)} / ${formatNumber(item.State, 0)}</div>
                <div class="current ${tclass}" title="现价 / 涨跌">₵${formatNumber(item.Current, 2)}<span class="tag ${tclass}">${flu}</span></div>
                ${time}
  </li>`;
  return box;
}

function loadIndexPage2() {
  if ($('#grailIndex').length === 0) {
    //$('body').css('overflow-x', 'auto');
    var index = `<div id="grailIndex" class="grail_index tab_page_item tab_page_item_1 scroller">
                <div class="index"><div class="title">/ 最高市值</div><ul class="mvc"></ul></div>
                <div class="index"><div class="title">/ 最大涨幅</div><ul class="mrc"></ul></div>
                <div class="index"><div class="title">/ 最大跌幅</div><ul class="mfc"></ul></div>
              </div><div class="center_button tab_page_item tab_page_item_1"><button id="loadMoreButton2" class="load_more_button">[加载更多...]</button></div>`;
    $('#grailIndexTab2').after(index);
    $('#loadMoreButton2').data('page', 1);
  }
  $('#loadMoreButton2').on('click', function () { loadIndexPage2() });
  var page = $('#loadMoreButton2').data('page');
  var size = 10;
  if (page < 11) {
    var start = (page - 1) * size;
    var loadMore = false;
    getData(`chara/mvc/${page}/${size}`, function (d, s) {
      if (d.State === 0) {
        for (i = 0; i < d.Value.length; i++) {
          var item = d.Value[i];
          var chara = renderCharacter(item, i + start);
          $('#grailIndex .mvc').append(chara);
        }
        loadMore |= (d.Value.length == size);
      }
      getData(`chara/mrc/${page}/${size}`, function (d, s) {
        if (d.State === 0) {
          for (i = 0; i < d.Value.length; i++) {
            var item = d.Value[i];
            var chara = renderCharacter(item, i + start);
            $('#grailIndex .mrc').append(chara);
          }
          loadMore |= (d.Value.length == size);
        }
        getData(`chara/mfc/${page}/${size}`, function (d, s) {
          if (d.State === 0) {
            for (i = 0; i < d.Value.length; i++) {
              var item = d.Value[i];
              var chara = renderCharacter(item, i + start);
              $('#grailIndex .mfc').append(chara);
            }
            loadMore |= (d.Value.length == size);
            if (!loadMore)
              $('#loadMoreButton2').hide();
          }
        });
      });
    });
    $('#loadMoreButton2').data('page', page + 1);
  }
  if (page === 10)
    $('#loadMoreButton2').hide();
}

function loadIndexPage() {
  if ($('#grailIndex2').length === 0) {
    var box = `<div id="grailIndex2" class="grail_index tab_page_item tab_page_item_2 scroller">
                <div class="index"><div class="title">/ ICO最多资金</div><ul class="volume"></ul></div>
                <div class="index"><div class="title">/ ICO最近活跃</div><ul class="popular"></ul></div>
                <div class="index"><div class="title">/ ICO即将结束</div><ul class="recent"></ul></div>
              </div><div class="center_button tab_page_item tab_page_item_2"><button id="loadMoreButton" class="load_more_button">[加载更多...]</button></div>`;
    $('#grailIndexTab2').after(box);
    $('#loadMoreButton').data('page', 1);
  }
  $('#loadMoreButton').on('click', function () { loadIndexPage() });
  var page = $('#loadMoreButton').data('page');
  var size = 10;
  if (page < 11) {
    var start = (page - 1) * size;
    var loadMore = false;
    getData(`chara/mvi/${page}/${size}`, function (d, s) {
      if (d.State === 0) {
        for (i = 0; i < d.Value.length; i++) {
          var item = d.Value[i];
          var init = renderInitial(item, i + start);
          $('#grailIndex2 .volume').append(init);
        }
        loadMore |= (d.Value.length == size);
      }
      getData(`chara/rai/${page}/${size}`, function (d, s) {
        if (d.State === 0) {
          for (i = 0; i < d.Value.length; i++) {
            var item = d.Value[i];
            var init = renderInitial(item, i + start);
            $('#grailIndex2 .popular').append(init);
          }
          loadMore |= (d.Value.length == size);
        }
        getData(`chara/mri/${page}/${size}`, function (d, s) {
          if (d.State === 0) {
            for (i = 0; i < d.Value.length; i++) {
              var item = d.Value[i];
              var init = renderInitial(item, i + start);
              $('#grailIndex2 .recent').append(init);
            }
            loadMore |= (d.Value.length == size);
            if (!loadMore)
              $('#loadMoreButton').hide();
          }
        });
      });
    });
    $('#loadMoreButton').data('page', page + 1);
  }
  if (page === 10)
    $('#loadMoreButton').hide();
}

function loadIndexTab() {
  var tab = `<div id="grailIndexTab" class="grail_index_tab">
    <div id="tabButton1" class="tab_button active">交易榜单</div>
    <div id="tabButton2" class="tab_button">ICO榜单</div>
  </div>`;
  $('#lastTemples').after(tab);
  $('#tabButton1').on('click', function () {
    $('#tabButton1').addClass('active');
    $('#tabButton2').removeClass('active');
    $('#grailIndex').remove();
    $('#loadMoreButton').remove();
    $('#loadMoreButton2').remove();
    loadIndexPage2();
  });
  $('#tabButton2').on('click', function () {
    $('#tabButton2').addClass('active');
    $('#tabButton1').removeClass('active');
    $('#grailIndex').remove();
    $('#loadMoreButton').remove();
    $('#loadMoreButton2').remove();
    loadIndexPage();
  });
}

function loadNewTab() {
  var tab = `<div id="grailIndexTab2" class="scroller">
    <div class="grail_index_tab">
      <div id="tabButton0" class="tab_button active">首页</div>
      <div id="tabButton3" class="tab_button">热门排行</div>
      <div id="tabButton4" class="tab_button">英灵殿</div>
      <div id="tabButton5" class="tab_button">幻想乡(β)</div>
      <div id="tabButton1" class="tab_button">交易榜单</div>
      <div id="tabButton2" class="tab_button">ICO</div>
    </div>
  </div>`;
  $('#grailBox2').after(tab);

  $('#tabButton0').on('click', function () {
    $('#grailIndexTab2 .tab_button').removeClass('active');
    $('#tabButton0').addClass('active');
    switchTab(0);
  });

  $('#tabButton1').on('click', function () {
    $('#grailIndexTab2 .tab_button').removeClass('active');
    $('#tabButton1').addClass('active');
    switchTab(1);
    if (!$('#tabButton1').data('loaded')) {
      $('#tabButton1').data('loaded', true);
      loadIndexPage2();
    }
  });

  $('#tabButton2').on('click', function () {
    $('#grailIndexTab2 .tab_button').removeClass('active');
    $('#tabButton2').addClass('active');
    switchTab(2);
    if (!$('#tabButton2').data('loaded')) {
      $('#tabButton2').data('loaded', true);
      loadIndexPage();
    }
  });

  $('#tabButton3').on('click', function () {
    $('#grailIndexTab2 .tab_button').removeClass('active');
    $('#tabButton3').addClass('active');
    switchTab(3);
    loadNewBangumi(1);
  });

  $('#tabButton4').on('click', function () {
    $('#grailIndexTab2 .tab_button').removeClass('active');
    $('#tabButton4').addClass('active');
    switchTab(4);
    loadValhalla(1, 'tinygrail', 'valhalla', 4);
  });

  $('#tabButton5').on('click', function () {
    $('#grailIndexTab2 .tab_button').removeClass('active');
    $('#tabButton5').addClass('active');
    switchTab(5);
    loadValhalla(1, 'blueleaf', 'lotusland', 5);
  });

  $(document).on('click', '.grail_index .auction_button', (e) => {
    var chara = $(e.currentTarget).data('chara');
    openAuctionDialog(chara);
  });
  $(document).on('click', '.grail_index .history_button', (e) => {
    var chara = $(e.currentTarget).data('chara');
    openHistoryDialog(chara);
  });
}

function switchTab(index) {
  $(`.tab_page_item`).hide();
  $(`.tab_page_item_${index}`).show();
}

function loadValhalla(page, user, name, index) {
  var className = `.tab_page_item_${index}`;
  var id = `#${name}`;
  var auction = false;
  if (name == 'valhalla')
    auction = true;

  $(`${id} .page`).hide();

  var p = $(`${className} .page.page${page}`);
  if (p.length > 0) {
    $(`#pager${index} .p`).removeClass('p_cur');
    $(`#pager${index} .p[data-page=${page}]`).addClass('p_cur');
    p.show();
    return;
  }

  if ($(id).length == 0) {
    var valhalla = `<div id="${name}" class="grail_index tab_page_item tab_page_item_${index}"><div class="loading" style="display:none"></div></div>`;
    $('#grailIndexTab2').after(valhalla);
  }

  $(`${id} .loading`).show();
  getData(`chara/user/chara/${user}/${page}/36`, function (d, s) {
    $(`${id} .loading`).hide();
    $(id).append(`<div class="page page${page}"></div>`);
    if (d.State === 0) {
      var ids = [];
      var start = (page - 1) * 36;
      for (i = 0; i < d.Value.Items.length; i++) {
        var item = d.Value.Items[i];
        ids.push(parseInt(item.Id));
        var chara = $(renderCharacter3(item, i + start, auction));
        $(`${id} .page.page${page}`).append(chara);
        $(`${id} .page.page${page} .auction_button[data-id=${item.Id}]`).data('chara', item);
        $(`${id} .page.page${page} .history_button[data-id=${item.Id}]`).data('chara', item);
      }
      loadPager(d.Value.TotalPages, d.Value.CurrentPage, name, `pager${index}`, (p) => { loadValhalla(p, user, name, index) }, '#grailIndexTab2', index);

      if (auction)
        loadUserAuctions(ids);
    }
  });
}

function loadUserAuctions(ids) {
  postData('chara/auction/list', ids, (d) => {
    if (d.State == 0) {
      d.Value.forEach((a) => {
        if (a.State != 0) {
          var userAuction = `<span class="user_auction" title="竞拍人数 / 竞拍数量">${formatNumber(a.State, 0)} / ${formatNumber(a.Type, 0)}</span>`;
          $(`#valhalla .auction_button[data-id=${a.CharacterId}]`).before(userAuction);
          $(`.item_list[data-id=${a.Id}] .time`).after(userAuction);
          $('#TB_window.dialog .desc').append(userAuction);
        }
        if (a.Price != 0) {
          var myAuction = `<span class="my_auction" title="出价 / 数量">₵${formatNumber(a.Price, 2)} / ${formatNumber(a.Amount, 0)}</span>`;
          $(`#valhalla .auction_button[data-id=${a.CharacterId}]`).before(myAuction);
          $(`.item_list[data-id=${a.Id}] .time`).after(myAuction);
          $('#TB_window.dialog .desc').append(myAuction);
        }
      });
    }
  });
}

function openAuctionDialog(chara) {
  var price = Math.ceil(chara.Price);
  var total = formatNumber(price * chara.State, 2);
  var dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
              <div id="TB_window" class="dialog" style="display:block;">
                <div class="title" title="拍卖底价 / 竞拍数量 / 流通股份">股权拍卖 - #${chara.Id} 「${chara.Name}」 ₵${formatNumber(chara.Price, 2)} / ${formatNumber(chara.State, 0)} / ${formatNumber(chara.Total, 0)}</div>
                <div class="desc">输入竞拍出价和数量参与竞拍</div>
                <div class="label"><span class="input">价格</span><span class="input">数量</span><span class="total">合计 -₵${total}</span></div>
                <div class="trade auction">
                  <input class="price" type="number" min="${price}" value="${price}">
                    <input class="amount" type="number" min="1" max="${chara.State}" value="${chara.State}">
                      <button id="bidAuctionButton" class="active">确定</button><button id="cancelDialogButton">取消</button></div>
                    <div class="loading" style="display:none"></div>
                    <a id="TB_closeWindowButton" title="Close">X关闭</a>
  </div>`;
  $('body').append(dialog);
  var ids = [chara.Id];
  loadUserAuctions(ids);
  // $('#TB_window').css("margin-left", $('#TB_window').width() / -2);
  // $('#TB_window').css("margin-top", $('#TB_window').height() / -2);
  $('#cancelDialogButton').on('click', closeDialog);
  $('#TB_closeWindowButton').on('click', closeDialog);
  $('#TB_window .auction input').on('keyup', () => {
    var price = $('.trade.auction .price').val();
    var amount = $('.trade.auction .amount').val();
    var total = formatNumber(price * amount, 2);
    $("#TB_window .label .total").text(`合计 -₵${total}`);
  });
  $('#bidAuctionButton').on('click', function () {
    var price = $('.trade.auction .price').val();
    var amount = $('.trade.auction .amount').val();
    $("#TB_window .loading").show();
    $('#TB_window .label').hide();
    $("#TB_window .desc").hide();
    $("#TB_window .trade").hide();
    postData(`chara/auction/${chara.Id}/${price}/${amount}`, null, (d) => {
      $("#TB_window .loading").hide();
      $('#TB_window .label').show();
      $("#TB_window .desc").show();
      $("#TB_window .trade").show();
      if (d.State == 0) {
        var message = d.Value;
        $('#TB_window .trade').hide();
        $('#TB_window .label').hide();
        $('#TB_window .desc').text(message);
        $(`#valhalla .user_auction[data-id=${chara.Id}]`).text(`₵${formatNumber(price, 2)} / ${formatNumber(amount, 0)} `);
      } else {
        alert(d.Message);
      }
    });
  });
}

function loadPager(total, current, target, pager, loadPage, anchor, tabIndex) {
  var p = $(`<div id="${pager}" class="grail page_inner"></div>`);
  if (tabIndex)
    p = $(`<div id="${pager}" class="grail page_inner tab_page_item tab_page_item_${tabIndex}"></div>`);

  if (!anchor) anchor = '';
  else anchor = `href="${anchor}"`;

  for (i = 1; i <= total; i++) {
    if (current == i)
      p.append(`<a ${anchor} class="p p_cur" data-page="${i}">${i}</a>`);
    else
      p.append(`<a ${anchor} class="p" data-page="${i}">${i}</a>`);
  }
  $(`#${pager}`).remove();
  $(`#${target}`).after(p);
  $(`#${pager} a.p`).on('click', (e) => { loadPage($(e.currentTarget).data('page')); });
}

function loadNewBangumi(page) {
  $('#grailNewBangumi .page').hide();

  var p = $(`#grailNewBangumi .page.page${page}`);
  if (p.length > 0) {
    $('#pager1 .p').removeClass('p_cur');
    $(`#pager1 .p[data-page=${page}]`).addClass('p_cur');
    p.show();
    return;
  }

  if ($('#grailNewBangumi').length === 0) {
    $('#grailIndexTab2').after(`<div id="grailNewBangumi" class="grail_index tab_page_item tab_page_item_3 scroller"></div>`);
  }

  var size = 10;
  var start = (page - 1) * size;
  var loadMore = false;

  var topPage = 11 - page;
  var topStart = 100 - start;

  var p = `<div class="page page${page}"><div class="index"><div class="title">/ 番市首富</div><ul class="top"></ul></div>
                    <div class="index"><div class="title">/ 最高股息</div><ul class="tnbc"></ul></div>
                    <div class="index"><div class="title">/ 新番活跃</div><ul class="nbc"></ul></div></div>`;

  $('#grailNewBangumi').append(p);

  getData(`chara/top/${page}/${size}`, function (d, s) {
    if (d.State === 0) {
      for (i = 0; i < d.Value.length; i++) {
        var item = d.Value[i];
        var user = renderUser(item, i + start);
        $(`#grailNewBangumi .page${page} .top`).append(user);
      }
    }
    getData(`chara/msrc/${page}/${size}`, function (d, s) {
      if (d.State === 0) {
        for (i = 0; i < d.Value.length; i++) {
          var item = d.Value[i];
          var chara = renderCharacter(item, i + start);
          $(`#grailNewBangumi .page${page} .tnbc`).append(chara);
        }
        getData(`chara/nbc/${page}/${size}`, function (d, s) {
          if (d.State === 0) {
            for (i = 0; i < d.Value.length; i++) {
              var item = d.Value[i];
              var chara = renderCharacter(item, i + start);
              $(`#grailNewBangumi .page${page} .nbc`).append(chara);
            }
          }
        });
      }
    });
  });
  loadPager(10, page, 'grailNewBangumi', 'pager1', loadNewBangumi, '#grailIndexTab2', 3);
}

function loadGrailBox2(callback) {
  $('body').css('overflow-x', 'auto');
  $('#grailBox2').remove();
  $('div.eden_rec_box').css('padding-left', 0);
  $('div.eden_rec_box').css('background', 'none');
  getUserAssets(function (d, s) {
    if (d.State === 0) {
      var bonus = `<button class="tag daily_bonus">已领取</button>`;
      var share = '';

      if (d.Value.ShowDaily)
        bonus = `<button id="bonusButton" class="active tag daily_bonus">签到奖励</button>`;

      if (d.Value.ShowWeekly)
        share = `<button id="shareBonusButton" class="active tag phone_bonus">每周分红</button>`;

      var userBox = `<div id="grailBox2" class="rakuen_home" data-name="${d.Value.Name}">
                      <div class="user_info">「小圣杯」账户余额：₵${formatNumber(d.Value.Balance, 2)}
                        <button id="logoutButton" class="text_button">[退出登录]</button>
                        <button id="testButton" class="text_button">[股息预测]</button>
                      </div>
                      <div class="buttons">
                        <button class="active tag" id="scratchButton">刮刮乐</button>${share}${bonus}
                      </div>
                    </div>`
      $('body').prepend(userBox);
      $('#logoutButton').on('click', function () { logout(loadGrailBox2) });
      $('#testButton').on('click', function () {
        getData('event/share/bonus/test', (d) => {
          if (d.State == 0) {
            if (d.Value.Daily)
              alert(`本期计息股份共${formatNumber(d.Value.Total, 0)}股，圣殿${formatNumber(d.Value.Temples, 0)}座，登录奖励₵${formatNumber(d.Value.Daily, 0)}，预期股息₵${formatNumber(d.Value.Share, 0)}，需缴纳个人所得税₵${formatNumber(d.Value.Tax, 0)}`);
            else
              alert(`本期计息股份共${formatNumber(d.Value.Total, 0)}股，圣殿${formatNumber(d.Value.Temples, 0)}座，预期股息₵${formatNumber(d.Value.Share, 0)}，需缴纳个人所得税₵${formatNumber(d.Value.Tax, 0)}`);
          } else {
            alert(d.Message);
          }
        });
      });
      $('#scratchButton').on('click', function () {
        openScratchDialog(0);
      });
      $('#bonusButton').on('click', function () { getDailyBangumiBonus(loadGrailBox2) });
      $('#shareBonusButton').on('click', function () { getWeeklyShareBonus(loadGrailBox2) });
    } else {
      var userBox = `<div id="grailBox2" class="rakuen_home"><div class="bold" style="margin: 7px 0 0 7px">点击授权登录，开启「小圣杯」最萌大战！</div><button id="loginButton" class="active tag">授权登录</button></div>`
      $('body').prepend(userBox);
      $('#loginButton').on('click', function () { login(loadGrailBox2) });
    }
    loadHolidayButton();
    loadPhoneButton();

    var open = localStorage.getItem('openBackgroundDialog');
    if (!open)
      openBackgroundDialog();

    if (callback) callback();
  });
}

function openScratchDialog(templeId) {
  var name = '彩票抽奖';
  var desc = '消费₵1,000购买一张环保刮刮乐彩票？';
  var option = '<div class="option left"><button id="lotusButton" class="checkbox">幻想乡<span class="slider"><span class="button"></span></span></button></div>';

  if (templeId > 0) {
    name = '混沌魔方';
    desc = '确定消耗10点资产值使用1个「混沌魔方」？';
    option = '';
  }

  var dialog = `<div class="new_overlay" id="scratchDialog">
  <div class="new_dialog">
    <div class="title">${name}</div>
    <div class="desc">${desc}</div>
    ${option}
    <div class="action"><button id="cancelButton">取消</button><button class="active" id="confirmButton">确定</button></div>
    <div class="loading" style="display:none;"></div>
    <a class="close_button" title="Close">X关闭</a>
  </div></div>`;

  $('body').append(dialog);
  $('body').css('overflow-y', 'hidden');


  getData('event/daily/count/10', (d) => {
    if (d.State == 0) {
      var count = d.Value * 1;
      var price = Math.pow(2, count) * 2000;
      $('#lotusButton').data('count', count);
      if ($('#lotusButton').hasClass('on')) {
        $('#scratchDialog .desc').text(`消费₵${formatNumber(price, 0)}购买一张幻想乡彩票？`);
      }
    }
  });

  $('#lotusButton').on('click', (e) => {
    if ($('#lotusButton').hasClass('on')) {
      $('#lotusButton').removeClass('on');
      $('#lotusButton .button').animate({ 'margin-left': '0px' });
      $('#lotusButton .button').css('background-color', '#ccc');
      $('#scratchDialog .desc').text('消费₵1,000购买一张环保刮刮乐彩票？');
    } else {
      $('#lotusButton').addClass('on');
      var count = $('#lotusButton').data('count');
      var price = Math.pow(2, count) * 2000;
      $('#lotusButton .button').animate({ 'margin-left': '20px' });
      $('#lotusButton .button').css('background-color', '#7fc3ff');
      $('#scratchDialog .desc').text(`消费₵${formatNumber(price, 0)}购买一张幻想乡彩票？`);
      //$('.trade.finance input').val(amount);
    }
  });

  $('#scratchDialog').on('click', '.sell_button', e => {
    if ($(e.currentTarget).hasClass('disabled')) return;
    $(e.currentTarget).addClass('disabled');
    var id = $(e.currentTarget).data('id');
    var amount = $(e.currentTarget).data('amount') * 1;
    var price = $(e.currentTarget).data('price') * 1;
    askCharacter(id, amount, price, d => {
      if (d.State == 0) {
        $(e.currentTarget).remove();
        var total = $(`#scratchDialog .card[data-id=${id}]`).data('amount') * 1;
        var rest = total - amount;
        if (rest > 0) {
          $(`#scratchDialog .card[data-id=${id}] .finance_button`).data('amount', rest);
          $(`#scratchDialog .card[data-id=${id}] .card_name .badge`).text(`×${rest}`);
        } else {
          $(`#scratchDialog .card[data-id=${id}] .finance_button`).remove();
          $(`#scratchDialog .card[data-id=${id}] .card_name .badge`).remove();
        }
        alert(`出售完成：获得资金 ₵${formatNumber(price * amount, 0)}`);
      } else {
        alert(d.Message);
      }
      $(e.currentTarget).removeClass('disabled');
    });
  });

  $('#scratchDialog').on('click', '.finance_button', e => {
    if ($(e.currentTarget).hasClass('disabled')) return;
    $(e.currentTarget).addClass('disabled');
    var id = $(e.currentTarget).data('id');
    var amount = $(e.currentTarget).data('amount');
    sacrificeCharacter(id, amount, true, d => {
      if (d.State == 0) {
        $(`#scratchDialog .card[data-id=${id}] .action`).hide();
        $(`#scratchDialog .card[data-id=${id}] .card_name .badge`).remove();
        var message = `融资完成：获得资金 ₵${formatNumber(d.Value.Balance, 0)}`;
        alert(message);
      } else {
        alert(d.Message);
      }
      $(e.currentTarget).removeClass('disabled');
    });
  });

  $('#scratchDialog').on('click', '.charge_button', e => {
    if ($(e.currentTarget).hasClass('disabled')) return;
    $(e.currentTarget).addClass('disabled');
    var id = $(e.currentTarget).data('id');
    var cname = $(e.currentTarget).data('name');
    var cover = $(e.currentTarget).data('cover');
    var name = $('#grailBox2.rakuen_home').data('name');
    getData(`chara/user/${id}/${name}/false`, (d) => {
      if (d.State == 0) {
        var chara = d.Value;
        chara.Id = chara.CharacterId;
        chara.Name = cname;
        chara.Icon = cover;
        chara.UserTotal = chara.Total;
        chara.UserAmount = chara.Amount;
        openSearchCharacterDialog(chara, name, 'charge');
      } else {
        alert(d.Message);
      }
    });
  });

  $('#scratchDialog #confirmButton').on('click', e => {
    $('#scratchDialog .loading').show();
    $('#scratchDialog .action').hide();
    $('#scratchDialog .desc').hide();
    $('#scratchDialog .option').hide();

    if (templeId > 0) {
      postData(`magic/chaos/${templeId}`, null, data => {
        $('.loading').hide();
        if (data.State == 0) {
          var card = renderCard(data.Value);
          var cards = `<div class="cards">${card}</div>`;
          $('#scratchDialog .new_dialog').append(cards);
        } else {
          $('#scratchDialog .desc').show();
          $('#scratchDialog .desc').text(data.Message);
        }
      });
    } else {
      var url = 'event/scratch/bonus2';
      if ($('#lotusButton').hasClass('on'))
        url = 'event/scratch/bonus2/true';

      getData(url, data => {
        $('.loading').hide();
        if (data.State == 0) {
          var cards = '<div class="cards">';
          for (var i = 0; i < data.Value.length; i++) {
            var chara = data.Value[i];
            var card = renderCard(chara);
            cards += card;
          }
          cards += '</div>';
          $('#scratchDialog .new_dialog').append(cards);
          if ($('#lotusButton').hasClass('on')) {
            var count = $('#lotusButton').data('count');
            var price = Math.pow(2, count + 1) * 2000;
            $('#lotusButton').data('count', count + 1);
            $('#scratchDialog .desc').text(`消费₵${formatNumber(price, 0)}购买一张幻想乡彩票？`);
          }
        } else {
          $('#scratchDialog .desc').show();
          $('#scratchDialog .desc').text(data.Message);
        }
      });
    }
  });

  $('#scratchDialog').on('click', '.cover', e => {
    var cover = $(e.currentTarget);
    if (!cover.hasClass('front')) {
      cover.addClass('front');
      var card = cover.parent();
      var id = card.data('id');
      var name = card.data('name');
      //console.log(id);
      card.find('.card_name .name').text(name);
      card.find('.card_name .name').on('click', e => {
        openCharacterDialog(id);
      });
      card.find('.card_front').on('click', e => {
        openCharacterDialog(id);
      });
      card.find('.action').show();
    }
  });

  addCloseDialog('#scratchDialog');
  $('#scratchDialog #cancelButton').on('click', e => {
    closeNewDialog('#scratchDialog');
  });
}

function renderCard(chara) {
  var cover = chara.Cover;

  var sellButton = `<button class="sell_button active" data-id="${chara.Id}" data-amount="${chara.SellAmount}" data-price="${chara.SellPrice}">出售(₵${formatNumber(chara.SellPrice, 0)})</button>`;
  if (chara.SellPrice == 0 || chara.SellAmount == 0)
    sellButton = '';

  if (cover.startsWith('https://tinygrail.oss-cn-hangzhou.aliyuncs.com/'))
    cover += '!w240';

  var card = `<div class="card" data-id="${chara.Id}" data-name="${chara.Name}" data-amount="${chara.Amount}">
              <div class="cover">
                <div class="card_back"></div>
                <div class="card_front lv${chara.Level}" style="background-image:url(${cover})">
                  <div class="tag lv${chara.Level}">${chara.Level}</div>
                  <div class="buff">₵${formatNumber(chara.CurrentPrice, 0)}</div>
                </div>
              </div>
              <div class="card_name"><span class="name">???</span><span class="badge">×${chara.Amount}</span></div>
              <div class="action" style="display:none;">
                ${sellButton}
                <button class="finance_button" data-id="${chara.Id}" data-amount="${chara.Amount}">融资</button>
                <button class="charge_button" data-id="${chara.Id}" data-name="${chara.Name}" data-cover="${chara.Cover}">充能</button>
              </div>
            </div>`;

  return card;
}

function sellCharacter(id, amount) {

}

function addSpinLoading(target) {
  var spinner = document.createElement('div');
  spinner.className = 'spin_loading';
  var num = 7,
    ang = 360 / num,
    rad = num * 3;
  for (var i = 0; i < num; i++) {
    var button = document.createElement('div');
    button.className = "dot" + i + " dot";
    button.style.top = rad * Math.cos(ang * i * Math.PI / 180) - 10 + "px";
    button.style.left = rad * Math.sin(ang * i * Math.PI / 180) - 10 + "px";
    button.style.backgroundColor = "hsla(" + ang * i + ", 50%, 50%, 1)";

    button.style.animation =
      "osc 2s ease-in-out infinite " + i / (num / 2) + "s, rainbow 8s infinite " + i / (num / 2) + "s";

    spinner.appendChild(button);
  }

  target.appendChild(spinner);
}

function removeSpinLoading(target) {
  $(target).find('.spin_loading').remove();
}

function loadPhoneButton() {
  getData('account/bind', function (d, s) {
    var phone = true;
    if (d.State != 0) {
      var button = `<button id="phoneButton" class="active tag phone_bonus">手机奖励</button>`;
      $('button.daily_bonus').before(button);
      $('#phoneButton').on('click', loadBindPhoneBox);
      phone = false;
    }

    loadRecommendButton(phone);
  });
}

function loadHolidayButton() {
  getData('event/holiday/bonus/check', function (d, s) {
    if (d.State == 0) {
      var holiday = d.Value;
      var button = `<button id="holidayButton" class="active tag phone_bonus">${holiday}福利</button>`;
      $('button.daily_bonus').before(button);
      $('#holidayButton').on('click', function () { getHolidayBonus(loadGrailBox2) });
    }
  });
}

function loadSendButton() {
  var button = `<a href="#" id="sendButton" class="chiiBtn"><span>发送红包</span></a>`;
  $('.headerContainer .nameSingle .rr').prepend(button);
  $('#sendButton').on('click', function () { openSendDialog() });
  // getData('event/holiday/check', function (d, s) {
  //   if (d.State == 0) {
  //     var button = `<a href="#" id="sendButton" class="chiiBtn"><span>发送红包</span></a>`;
  //     $('.headerContainer .nameSingle .rr').prepend(button);
  //     $('#sendButton').on('click', function () { openSendDialog() });
  //   }
  // });
}

function openSendDialog(userName, nickName) {
  if (!userName)
    userName = path.split('?')[0].substr(6);

  if (!nickName)
    nickName = $('.headerContainer .nameSingle .inner a').text();

  var dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
  <div id="TB_window" class="dialog send_dialog" style="display:block;">
    <div class="title">发送红包给「${nickName}」</div>
    <div class="desc">输入祝福留言和红包金额：</div>
    <div class="trade message"><input class="amount" type="text" placeholder="大吉大利，今晚吃鸡"></div>
    <div class="trade finance"><input class="amount" type="number" min="1" max="10000" value="10000"><button id="financeButton" class="active">确定</button><button id="cancelDialogButton">取消</button></div>
    <div class="loading" style="display:none"></div>
    <a id="TB_closeWindowButton" title="Close">X关闭</a>
  </div>`;
  $('body').append(dialog);
  $('#cancelDialogButton').on('click', closeDialog);
  $('#TB_closeWindowButton').on('click', closeDialog);
  $('#financeButton').on('click', function () {
    var amount = $('.trade.finance input').val();
    var message = $('.trade.message input').val();
    $('#TB_window .trade.finance').hide();
    $('#TB_window .trade.message').hide();
    postData(`event/send/${userName}/${amount}/${encodeURIComponent(message)}`, null, d => {
      if (d.State == 0) {
        $('#TB_window .desc').text('发送成功');
      } else {
        $('#TB_window .desc').text(d.Message);
      }
    });
  });
}

function loadRecommendButton(phone) {
  getData('account/recommend', function (d, s) {
    if (d.State === 0) {
      var button = `<button id="recommendButton" class="active tag phone_bonus">推荐奖励</button>`;
      $('button.daily_bonus').before(button);
      $('#recommendButton').on('click', function () { loadRecommendBox(d.Value, phone) });
    }
  });
}

// function loadShareBonusButton() {
//   getData('event/share/bonus/check', function (d, s) {
//     if (d.State === 0) {
//       var button = `<button id="shareBonusButton" class="active tag phone_bonus">每周分红</button>`;
//       $('button.daily_bonus').before(button);
//       $('#shareBonusButton').on('click', function () { getWeeklyShareBonus(loadGrailBox2) });
//     }
//   });
// }

function loadBindPhoneBox() {
  $('#phoneButton').unbind('click');
  $('#phoneButton').on('click', function () {
    $('#phoneBox').remove();
    $('#phoneButton').unbind('click');
    $('#phoneButton').on('click', loadBindPhoneBox);
  });
  var phone = `<div id="phoneBox">
                    <input id="phoneNumber" type="number" placeholder="请输入手机号"></input>
                    <input id="validateCode" type="number" placeholder="请输入验证码"></input>
                    <button id="codeButton" class="text_button">获取验证码</button>
                    <button id="bindButton" class="active tag">绑定</button>
                  </div>`;
  $('#grailBox2').after(phone);
  $('#codeButton').on('click', sendSMSCode);
  $('#bindButton').on('click', bindPhone);
}

function loadRecommendBox(token, phone) {
  $('#recommendButton').unbind('click');
  $('#recommendButton').on('click', function () {
    $('#recommendBox').remove();
    $('#recommendButton').unbind('click');
    $('#recommendButton').on('click', function () { loadRecommendBox(token) });
  });

  var input = `<div><input id="recommendCode" type="text" placeholder="请输入推荐码"></input>
                    <button id="recommendBonusButton" class="active tag">获取奖励</button></div>`
  if (token.State === 1) input = '<div class="desc">您已经领取过推荐奖励。</div>';
  if (phone != true) input = '<div class="desc">您尚未绑定手机。</div>';

  var recommend = `<div id="recommendBox">${input}
                    <div class="desc"><span class="code">${token.Hash}#${token.Token}</span>将这个推荐码发送给你的朋友，注册成功绑定手机后双方都可获得奖励。</div>
                  </div>`;

  $('#grailBox2').after(recommend);
  $('#recommendBonusButton').on('click', getRecommendBonus);
}

function sendSMSCode() {
  var phone = $('#phoneNumber').val();
  if (phone < 10000000000 || phone > 19999999999) {
    alert("请输入有效的手机号。");
    return;
  }
  $('#codeButton').unbind();
  postData(`account/sms/${phone}`, null, function (d, s) {
    if (d.State === 0)
      alert(d.Value);
    else
      alert(d.Message);
    $('#codeButton').on('click', sendSMSCode);
  });
}

function bindPhone() {
  var code = $('#validateCode').val();
  if (code < 100000 || code > 999999) {
    alert("请输入有效的验证码。");
    return;
  }
  $('#bindButton').unbind();
  postData(`account/validate/${code}`, null, function (d, s) {
    if (d.State === 0) {
      getData('event/bangumi/bonus/cellphone', function (d, s) {
        if (d.State === 0) {
          alert(d.Value);
          $('#phoneButton').remove();
          $('#phoneBox').remove();
          loadGrailBox2();
          return;
        } else {
          alert(d.Message);
        }
      });
    }
    else {
      alert(d.Message);
    }
    $('#bindButton').on('click', bindPhone);
  });
}

function getRecommendBonus() {
  var code = $('#recommendCode').val();
  if (code.indexOf('#') < 0) {
    alert("请输入有效的推荐码。");
    return;
  } else {
    code = code.replace('#', '%23');
  }

  $('#recommendBonusButton').unbind();
  postData(`event/bangumi/bonus/recommend/${code}`, null, function (d, s) {
    if (d.State === 0) {
      alert(d.Value);
      $('#recommendBox').remove();
      loadGrailBox2();
      return;
    } else {
      alert(d.Message);
    }
    $('#recommendBonusButton').on('click', getRecommendBonus);
  });
}

function caculateICO(ico) {
  var level = 0;
  var price = 10;
  var amount = 0;
  var next = 100000;
  var nextUser = 15;

  //人数等级
  var heads = ico.Users;
  var headLevel = Math.floor((heads - 10) / 5);
  if (headLevel < 0) headLevel = 0;

  //资金等级
  while (ico.Total >= next && level < headLevel) {
    level += 1;
    next += Math.pow(level + 1, 2) * 100000;
  }

  amount = 10000 + (level - 1) * 7500;
  price = ico.Total / amount;
  nextUser = (level + 1) * 5 + 10;

  return { Level: level, Next: next, Price: price, Amount: amount, Users: nextUser - ico.Users };
}

function reverseComments() {
  var config = getValueForKey('reverse');
  if (!config) config = 'on';

  var mutationObserver = new MutationObserver(function (list, obs) {
    if (list.length > 0 && list[0].addedNodes.length > 0) {
      $('#comment_list').prepend($(list[0].addedNodes));
    }
  });

  var reverseButton = `<button id="reverseButton" class="${config}">倒序<span class="slider"><span class="button"></span></span></button>`;
  if (path.startsWith('/rakuen/topic/crt/')) {
    $('hr.board').after('<h2 class="subtitle" style="margin: 10px 0 10px 5px;font-size:15px">吐槽箱</h2>')
    $('h2.subtitle').append(reverseButton);
  } else {
    $('.crtCommentList h2.subtitle').append(reverseButton);
  }
  $('#reverseButton').on('click', function () {
    if (config === 'on') {
      $('#reverseButton .button').animate({ 'margin-left': '0px' });
      $('#reverseButton .button').css('background-color', '#ccc');
      setValueForKey('reverse', 'off');
      config = 'off';
      $('hr.line').after($('#reply_wrapper'));
      reverseChild();
      mutationObserver.disconnect();
    }
    else {
      $('#reverseButton .button').animate({ 'margin-left': '20px' });
      $('#reverseButton .button').css('background-color', '#7fc3ff');
      setValueForKey('reverse', 'on');
      config = 'on';
      $('#comment_list').before($('#reply_wrapper'));
      reverseChild();
      mutationObserver.observe($('#comment_list')[0], { 'childList': true });
    }
  });

  if (config === 'off') return;
  $('#comment_list').before($('#reply_wrapper'));

  reverseChild();
  mutationObserver.observe($('#comment_list')[0], { 'childList': true });
}

function reverseChild() {
  var childObj = $('#comment_list').find('.row_reply');
  var total = childObj.length;

  childObj.each(function (i) {
    $('#comment_list').append(childObj.eq((total - 1) - i));
  });
}

function setValueForKey(key, value) {
  localStorage.setItem(key, value)
}

function getValueForKey(key) {
  return localStorage.getItem(key)
}

function loadGrailMenu() {
  var item = `<li><a href="#" id="recentMenu" class="top">小圣杯</a>
                    <ul>
                      <li><a href="#" id="recentMenu2">最近活跃</a></li>
                      <li><a href="#" id="myMenu">我的持仓</a></li>
                      <li><a href="#" id="auctionMenu">我的拍卖</a></li>
                      <li><a href="#" id="bidMenu">我的买单</a></li>
                      <li><a href="#" id="askMenu">我的卖单</a></li>
                      <li><a href="#" id="itemMenu">我的道具</a></li>
                      <li><a href="#" id="logMenu">资金日志</a></li>
                    </ul>
                  </li>`;
  $('.timelineTabs').append(item);

  $('#recentMenu').on('click', function () {
    menuItemClicked(loadRecentActivity);
  });
  $('#recentMenu2').on('click', function () {
    menuItemClicked(loadRecentActivity);
  });
  $('#myMenu').on('click', function () {
    menuItemClicked(loadUserAssets);
  });
  $('#bidMenu').on('click', function () {
    menuItemClicked(loadUserBid);
  });
  $('#askMenu').on('click', function () {
    menuItemClicked(loadUserAsk);
  });
  $('#logMenu').on('click', function () {
    menuItemClicked(loadUserLog);
  });
  $('#auctionMenu').on('click', function () {
    menuItemClicked(loadUserAuction);
  });
  $('#itemMenu').on('click', function () {
    menuItemClicked(loadUserItems);
  });
}

function menuItemClicked(callback) {
  $('.timelineTabs a').removeClass('focus');
  $('.timelineTabs a').removeClass('top_focus');
  $('#recentMenu').addClass('focus');
  if (callback) callback(1);
}

function listItemClicked() {
  var link = $(this).find('a.avatar').attr('href');
  if (link) {
    if (parent.window.innerWidth < 1200) {
      $(parent.document.body).find("#split #listFrameWrapper").animate({ left: '-450px' });
    }
    window.open(link, 'right');
  }
}

function loadCharacterList(list, page, total, more, render) {
  $('#eden_tpc_list ul .load_more').remove();
  for (i = 0; i < list.length; i++) {
    var item = list[i];
    var chara;
    if (render) chara = render(item, lastEven);
    else chara = renderCharacter2(item, lastEven);
    lastEven = !lastEven;
    $('#eden_tpc_list ul').append(chara);
  }
  $('#eden_tpc_list .item_list').on('click', listItemClicked);
  if (page != total && total > 0) {
    var loadMore = `<li class="load_more"><button id="loadCharacterButton" class="load_more_button" data-page="${page + 1}">[加载更多]</button></li>`;
    $('#eden_tpc_list ul').append(loadMore);
    $('#loadCharacterButton').on('click', function (e) {
      var page = $(e.currentTarget).data('page');
      if (more) more(page);
    });
  } else {
    var noMore = '暂无数据';
    if (total > 0)
      noMore = '加载完成';

    $('#eden_tpc_list ul').append(`<li class="load_more sub">[${noMore}]</li>`);
  }
}

function loadUserAssets(page) {
  // $('#eden_tpc_list ul').html('');
  // getData('chara/user/assets/0/true', function (d, s) {
  //   if (d.State === 0 && d.Value) {
  //     loadCharacterList(d.Value.Characters, 1, 1);
  //   }
  // });
  if (page === 1)
    $('#eden_tpc_list ul').html('');

  getData(`chara/user/chara/0/${page}/50`, function (d, s) {
    if (d.State === 0 && d.Value && d.Value.Items) {
      loadCharacterList(d.Value.Items, d.Value.CurrentPage, d.Value.TotalPages, loadUserAssets);
    }
  });
}

function loadUserAuction(page) {
  if (page === 1)
    $('#eden_tpc_list ul').html('');

  getData(`chara/user/auction/${page}/50`, function (d, s) {
    if (d.State === 0 && d.Value && d.Value.Items) {
      loadCharacterList(d.Value.Items, d.Value.CurrentPage, d.Value.TotalPages, loadUserAuction);
      var ids = [];
      d.Value.Items.forEach((i) => { ids.push(parseInt(i.CharacterId)); });
      loadUserAuctions(ids);
      $('.cancel_auction').unbind();
      $('.cancel_auction').on('click', (e) => {
        e.stopPropagation();
        if (!confirm('确定取消竞拍？'))
          return;

        var id = $(e.target).data('id');
        postData(`chara/auction/cancel/${id}`, null, (d2) => {
          if (d2.State == 0) {
            alert('取消竞拍成功。');
            $(`#eden_tpc_list li[data-id=${id}]`).remove();
          } else {
            alert(d2.Message);
          }
        });
      });
    }
  });
}

function loadUserAsk(page) {
  if (page === 1)
    $('#eden_tpc_list ul').html('');

  getData(`chara/asks/0/${page}/50`, function (d, s) {
    if (d.State === 0 && d.Value && d.Value.Items) {
      loadCharacterList(d.Value.Items, d.Value.CurrentPage, d.Value.TotalPages, loadUserAsk);
    }
  });
}

function loadUserItems(page) {
  if (page === 1)
    $('#eden_tpc_list ul').html('');

  getData(`chara/user/item/0/${page}/50`, function (d, s) {
    if (d.State === 0 && d.Value && d.Value.Items) {
      loadCharacterList(d.Value.Items, d.Value.CurrentPage, d.Value.TotalPages, loadUserItems, renderItem);
    }
  });
}

function loadUserBid(page) {
  if (page === 1)
    $('#eden_tpc_list ul').html('');

  getData(`chara/bids/0/${page}/50`, function (d, s) {
    if (d.State === 0 && d.Value && d.Value.Items) {
      loadCharacterList(d.Value.Items, d.Value.CurrentPage, d.Value.TotalPages, loadUserBid);
    }
  });
}

function loadUserLog(page) {
  if (page === 1)
    $('#eden_tpc_list ul').html('');

  getData(`chara/user/balance/${page}/50`, function (d, s) {
    if (d.State === 0 && d.Value && d.Value.Items) {
      loadCharacterList(d.Value.Items, d.Value.CurrentPage, d.Value.TotalPages, loadUserLog, renderBalanceLog);
      $('#eden_tpc_list ul li').on('click', function (e) {
        var id = $(e.target).data('id');
        if (id == null) {
          var result = $(e.target).find('small.time').text().match(/#(\d+)/);
          if (result && result.length > 0)
            id = result[1];
        }

        if (id != null && id.length > 0) {
          if (parent.window.innerWidth < 1200) {
            $(parent.document.body).find("#split #listFrameWrapper").animate({ left: '-450px' });
          }
          window.open(`/rakuen/topic/crt/${id}?trade=true`, 'right');
        }
      });
    }
  });
}

function loadRecentActivity(page) {
  if (page === 1)
    $('#eden_tpc_list ul').html('');

  getData(`chara/recent/${page}/50`, function (d, s) {
    if (d.State === 0 && d.Value && d.Value.Items) {
      loadCharacterList(d.Value.Items, d.Value.CurrentPage, d.Value.TotalPages, loadRecentActivity);
    }
  });
}

function renderBalanceLog(item, even) {
  var line = 'line_odd';
  if (even) line = 'line_even';

  var change = '';
  if (item.Change > 0)
    change = `<span class="tag raise large">+₵${formatNumber(item.Change, 2)}</span>`;
  else if (item.Change < 0)
    change = `<span class="tag fall large">-₵${formatNumber(Math.abs(item.Change), 2)}</span>`;

  var amount = '';
  if (item.Amount > 0)
    amount = `<span class="tag new large">+${formatNumber(item.Amount, 0)}</span>`;
  else if (item.Amount < 0)
    amount = `<span class="tag even large">${formatNumber(item.Amount, 0)}</span>`;

  var id = '';
  if (item.Type === 4 || item.Type === 5 || item.Type === 6) {
    id = `data-id="${item.RelatedId}"`;
  }

  var log = `<li class="${line} item_list item_log" ${id}>
                <div class="inner">₵${formatNumber(item.Balance, 2)}
                  <small class="grey">${formatTime(item.LogTime)}</small>
                  <span class="row"><small class="time">${item.Description}</small></span>
                </div>
                <span class="tags">
                  ${change}
                  ${amount}
                </span>
              </li>`
  return log;
}

function renderItem(item, even) {
  var line = 'line_odd';
  if (even) line = 'line_even';
  // var change = `<span class="tag fall">${formatNumber(item.Change, 2)}</span>`;
  // if (item.Change > 0)
  //   change = `<span class="tag raise">+${formatNumber(item.Change, 2)}</span>`;

  var id = item.Id;
  // if (item.Type === 4 || item.Type === 5 || item.Type === 6) {
  //   id = `data-id="${item.RelatedId}"`;
  // }

  var log = `<li class="${line} item_list" ${id}>
    <a href="#" target="right">
      <span class="avatarNeue avatarReSize32 ll" style="background-image:url('${normalizeAvatar(item.Icon)}')"></span>
    </a>
    <div class="inner">
      ${item.Name}
      <small class="grey">${formatTime(item.Last)}</small>
      <span class="row"><small class="time">「${item.Line}」</small></span>
    </div>
    <span class="tag badge large">×${formatNumber(item.Amount, 0)}</span>
  </li>`
  return log;
}

function renderCharacter2(item, even) {
  var line = 'line_odd';
  if (even) line = 'line_even';
  var amount = '';

  //拍卖
  if (item.Bid) {
    if (item.State != 0)
      amount = `<small title="出价 / 数量">₵${formatNumber(item.Price, 2)} / ${formatNumber(item.Amount, 0)}</small>`;
  } else if (item.State != 0) {
    amount = `<small title="持有股份 / 固定资产">${formatNumber(item.State, 0)} / ${formatNumber(item.Sacrifices, 0)}</small>`;
  } else {
    amount = `<small title="固定资产">${formatNumber(item.Sacrifices, 0)}</small>`;
  }

  var tag = renderCharacterTag(item);
  var depth = renderCharacterDepth(item);
  var cid = item.Id;
  var id = item.Id;
  var time = item.LastOrder;

  if (item.Bid) {
    cid = item.CharacterId;
    id = item.Id;
    time = item.Bid;
    var cancel = '';
    if (item.State == 0)
      cancel = `<small data-id="${id}" class="cancel_auction">[取消]</small>`;
    depth = `<small class="even" title="拍卖底价 / 拍卖数量">₵${formatNumber(item.Start, 2)} / ${formatNumber(item.Type, 0)}</small>${cancel}`;
    tag = renderAuctionTag(item);
  }

  var badge = '';
  if (!item.Bid)
    badge = renderBadge(item, false, true, true);

  var chara = `<li class="${line} item_list" data-id="${id}"><a href="/rakuen/topic/crt/${cid}?trade=true" class="avatar l" target="right">
                    <span class="avatarNeue avatarReSize32 ll" style="background-image:url('${normalizeAvatar(item.Icon)}')"></span></a><div class="inner">
                      <a href="/rakuen/topic/crt/${cid}?trade=true" class="title avatar l" target="right">${item.Name}${badge}</a> <small class="grey">(+${formatNumber(item.Rate, 2)} / ${formatNumber(item.Total, 0)} / ₵${formatNumber(item.MarketValue, 0)})</small>
                      <div class="row"><small class="time">${formatTime(time)}</small>${amount}<span title="买入 / 卖出 / 成交">${depth}</span></div></div>${tag}</li>`
  return chara;
}

function renderCharacterDepth(chara) {
  var depth = `<small class="raise">+${formatNumber(chara.Bids, 0)}</small><small class="fall">-${formatNumber(chara.Asks, 0)}</small><small class="even">${formatNumber(chara.Change, 0)}</small>`
  return depth;
}

function renderCharacterTag(chara, item) {
  var id = chara.Id;
  var flu = '--';
  var tclass = 'even';
  if (chara.Fluctuation > 0) {
    tclass = 'raise';
    flu = `+${formatNumber(chara.Fluctuation * 100, 2)}%`;
  } else if (chara.Fluctuation < 0) {
    tclass = 'fall';
    flu = `${formatNumber(chara.Fluctuation * 100, 2)}%`;
  }

  var tag = `<div class="tag ${tclass}" title="₵${formatNumber(chara.MarketValue, 0)} / ${formatNumber(chara.Total, 0)}">₵${formatNumber(chara.Current, 2)} ${flu}</div>`
  return tag;
}

function renderAuctionTag(auction) {
  var flu = '竞拍失败';
  var tclass = 'even';
  if (auction.State == 1) {
    tclass = 'raise';
    flu = '竞拍成功';
  } else if (auction.State == 0) {
    tclass = 'new';
    flu = '竞拍中';
  }

  var tag = `<div class="tag ${tclass}">${flu}</div>`
  return tag;
}

function addCharacterTag(chara, item) {
  var depth = renderCharacterDepth(chara);
  var tag = renderCharacterTag(chara);
  $(item).find('.row').append(depth);
  $(item).append(tag);
}

function fixMobilePage() {
  var body = parent.window.document.body;
  var links = $(body).find('#rakuenHeader .navigator .link a');
  $(body).find('#rakuenHeader .navigator .link').html(links);
  var menu = $('<div class="menu"><a href="#">菜单</a></div>');
  $(body).find('#rakuenHeader .navigator .menu').remove();
  $(body).find('#rakuenHeader .navigator').append(menu);
  $(body).find('#rakuenHeader .navigator .menu').on('click', function () {
    var link = $(body).find('#rakuenHeader .navigator .link');
    if (link.css('display') === 'none')
      link.css('display', 'flex');
    else
      link.css('display', 'none');
  });

  var mobile = ``
  if (navigator.userAgent.match(/mobile/i))
    mobile = `#split #listFrameWrapper {-webkit-overflow-scrolling:touch;} #split #contentFrameWrapper {-webkit-overflow-scrolling:touch;}`;

  $(parent.window.document.head).append('<meta name="viewport" content="width=device-width,user-scalable=no,initial-scale=.75,maximum-scale=.75,minimum-scale=.75,viewport-fit=cover" />');
  var css = `<style>
    #split {display: flex; }
    #split #listFrameWrapper {width:450px; min-width:450px; float:inherit; flex-grow:1; z-index: 100; height: -webkit-fill-available; }
    #split #contentFrameWrapper {width:450px; float:inherit; flex-grow:5; height: calc(100vh - 60px); }
    #split iframe {height: -webkit-fill-available; overflow-x:scroll; }
    #rakuenHeader div.navigator a {margin: 0 5px 0 0; }
    #rakuenHeader div.navigator a::after {content: "|"; margin-left: 5px; }
    #rakuenHeader div.navigator a:last-child::after {content: ""; }
    #rakuenHeader .navigator .menu {display:none; }
    ${mobile}
    @media (max-width: 1200px) {
      #rakuenHeader {background-position-x: 233px; }
      #rakuenHeader ul.rakuen_nav {display:none; }
    }
    @media (max-width: 800px){
      #rakuenHeader .navigator .link {display:none; flex-direction:column; position:absolute; top:50px; right:5px;
        border-radius: 5px; background: rgba(0, 0, 0, 0.6); padding: 10px; width: 100px; text-align: right; z-index:101; }
      #rakuenHeader div.navigator a {margin: 8px 0; font-size:18px; }
      #rakuenHeader div.navigator a::after {content: ""; }
      #rakuenHeader .navigator .menu {display:block; padding: 3px 0 0 6px; }
      #split #listFrameWrapper {position: absolute; left:-450px; }
    }
  </style>`;
  $(body).append(css);

  $(body).find('#rakuenHeader a.logo').removeAttr('href');
  $(body).find('#rakuenHeader a.logo').unbind('click');
  $(body).find('#rakuenHeader a.logo').on('click', function () {
    var list = $(body).find("#split #listFrameWrapper");
    if (list.position().left != 0)
      list.animate({ left: '0' });
    else
      list.animate({ left: '-450px' });
  });
}

function openCharacterDialog(id) {
  var dialog = `<div class="new_overlay chara${id}" id="tradeDialog">
  <div class="new_dialog">
    <div id="grailBox" class="chara${id}"><div class="loading"></div></div>
    <a class="close_button" title="Close">X关闭</a>
  </div></div>`;

  $('body').append(dialog);
  $('body').css('overflow-y', 'hidden');

  getData(`chara/${id}`, d => {
    if (d && d.State === 0) {
      if (d.Value.Current) {
        loadTradeBox(d.Value);
        $('.loading').hide();
      } else {
        loadICOBox(d.Value);
      }
    } else {
      var empty = `<div class="empty"><div class="text">“${name}”已做好准备，点击启动按钮，加入“小圣杯”的争夺！</div><button id="beginICOButton" class="rounded active">启动ICO</button></div>`;
      $(`#grailBox.chara${id}`).html(empty);
      $('#beginICOButton').on('click', function () { beginICO(id) });
    }
  });

  addCloseDialog(`#tradeDialog.chara${id}`);
}

function openSearchCharacterDialog(temple, username, action) {
  var title = `选择你想要「连接」的圣殿`;

  if (action == 'stardust')
    title = `选择「星光碎片」消耗的目标`;
  else if (action == 'guidepost')
    title = `选择「虚空道标」获取的目标`;
  else if (action == 'charge')
    title = `选择「星光碎片」充能的目标`;

  var dialog = `<div class="new_overlay" id="searchDialog">
  <div class="new_dialog">
    <div id="searchBox">
      <div class="title">${title}</div>
      <div class="search_bar"><input type="text" placeholder="输入角色名或ID"></input></div>
      <div class="loading"></div>
      <div class="chara_list"></div>
      <div class="pager"></div>
    </div>
    <a class="close_button" title="Close">X关闭</a>
  </div></div>`;

  $('body').append(dialog);
  $('body').css('overflow-y', 'hidden');

  if (action == 'link' || action == 'charge') {
    getUserTempleList(username, 1, '');
    $('#searchDialog .search_bar input').on('change', (e) => {
      var key = $(e.currentTarget).val();
      getUserTempleList(username, 1, key);
    });
  } else {
    var sort = 'desc';
    if (action == 'stardust')
      sort = 'asc';

    getUserCharacterList(username, 1, '', sort);
    $('#searchDialog .search_bar input').on('change', (e) => {
      var key = $(e.currentTarget).val();
      getUserCharacterList(username, 1, key);
    });
  }

  $(`#searchDialog .chara_list`).on('click', '.chara_item', (e) => {
    var toChara = $(e.currentTarget).data('chara');
    if (action == 'stardust')
      openConfirmCharacterDialog(toChara, temple, action);
    else if (action == 'charge')
      openConfirmCharacterDialog(temple, toChara, 'stardust');
    else
      openConfirmCharacterDialog(temple, toChara, action);
  });

  $(`#searchDialog .chara_list`).on('click', '.chara_item .name', (e) => {
    var cid = $(e.currentTarget).parent().parent().data('id');
    openCharacterDialog(cid);
    e.stopPropagation();
  });

  addCloseDialog('#searchDialog');
}

function getUserTempleList(username, page, keyword) {
  $('#searchDialog .chara_list').empty();
  $('#searchDialog .loading').show();
  $('#searchDialog .pager').empty();
  $('#searchDialog .pager').hide();

  getData(`https://tinygrail.com/api/chara/user/temple/${username}/${page}/24?keyword=${keyword}`, d => {
    if (d && d.State === 0) {
      d.Value.Items.forEach(c => {
        var item = renderTempleListItem(c);
        $('#searchDialog .chara_list').append(item);
        $(`#searchDialog .chara_list .chara_item[data-id=${c.CharacterId}]`).data('chara', c);
      });
    }
    if (d.Value.TotalPages > 1) {
      for (var i = 0; i < d.Value.TotalPages; i++) {
        var page = i + 1;
        var active = '';
        if (d.Value.CurrentPage == page)
          active = ' active';
        var pager = `<div class="page${active}" data-page="${page}">${page}</div>`;
        $('#searchDialog .pager').append(pager);
      }
      $('#searchDialog .pager').show();
      $('#searchDialog .pager .page').on('click', e => {
        var p = $(e.currentTarget).data('page');
        getUserTempleList(username, p, keyword);
      });
    }
    $('#searchDialog .loading').hide();
  });
}

function getUserCharacterList(username, page, keyword, sort) {
  $('#searchDialog .chara_list').empty();
  $('#searchDialog .loading').show();
  $('#searchDialog .pager').empty();
  $('#searchDialog .pager').hide();

  var url = `https://tinygrail.com/api/chara/user/chara/${username}/${page}/24?sort=${sort}`;
  if (keyword && keyword.length > 0)
    url = `https://tinygrail.com/api/chara/search/character?keyword=${keyword}`;

  getData(url, d => {
    if (d && d.State === 0) {
      var list = d.Value;
      if (d.Value.Items) {
        list = d.Value.Items;
        if (d.Value.TotalPages > 1) {
          for (var i = 0; i < d.Value.TotalPages; i++) {
            var page = i + 1;
            var active = '';
            if (d.Value.CurrentPage == page)
              active = ' active';
            var pager = `<div class="page${active}" data-page="${page}">${page}</div>`;
            $('#searchDialog .pager').append(pager);
          }
          $('#searchDialog .pager').show();
          $('#searchDialog .pager .page').on('click', e => {
            var p = $(e.currentTarget).data('page');
            getUserCharacterList(username, p, keyword, sort);
          });
        }
      }
      list.forEach(c => {
        var item = renderCharacterListItem(c);
        $('#searchDialog .chara_list').append(item);
        $(`#searchDialog .chara_list .chara_item[data-id=${c.Id}]`).data('chara', c);
      });
    }
    $('#searchDialog .loading').hide();
  });
}

function openConfirmCharacterDialog(fromChara, toChara, action) {
  var title = '';
  var content = '';

  if (action == 'link') {
    title = `确定「连接」的圣殿`;

    content = renderLink(fromChara, toChara);
    if (content != null) {
      content += `<div data-from-id="${fromChara.CharacterId}" data-to-id="${toChara.CharacterId}" class="button active link_button">LINK</div>`;
    }
  } else if (action == 'stardust') {
    title = `确定「星光碎片」消耗的目标`;

    var toColor = 'silver';
    if (toChara.Level == 2)
      toColor = 'gold';
    else if (toChara.Level == 3)
      toColor = 'purple';

    var fromCover = normalizeAvatar(fromChara.Icon);
    var toCover = getLargeCover(toChara.Cover);

    var assets = `<div class="asset" title="可用数量 / 重组数量">${fromChara.UserAmount} / ${fromChara.Sacrifices}</div>`;
    var assets2 = `<div class="asset" title="固定资产 / 重组数量">${toChara.Assets} / ${toChara.Sacrifices}</div>`;

    var max = toChara.Sacrifices - toChara.Assets;
    if (max > fromChara.UserAmount)
      max = fromChara.UserAmount;

    var option = '<div class="option"><div id="templeButton" class="checkbox">消耗圣殿<span class="slider"><span class="button"></span></span></div></div>';

    if (fromChara.UserAmount == 0 && fromChara.UserTotal == 0 && fromChara.Sacrifices == 0) {
      content = `<div class="content">所选目标没有资产</div>`;
    }
    else {
      content = `<div class="chara_convert">
    <div class="left item">
      <div class="container avatar" style="background-image:url(${fromCover})"></div>
      ${assets}
    </div>
    <div class="arrow_right"></div>
    <div class="right item ${toColor}">
      <div class="container card" style="background-image:url(${toCover})"></div>
      ${assets2}
    </div>
  </div>
  ${option}
  <div class="content"><span>消耗「${fromChara.Name}」</span><input type="number" min="0" max="${max}" value="${max}"><span>股补充「${toChara.Name}」的固定资产</span></div>
  <div data-from-id="${fromChara.Id}" data-to-id="${toChara.CharacterId}" class="button active convert_button">CONVERT</div>`;
    }
  }
  else if (action == 'guidepost') {
    title = `确定「虚空道标」获取的目标`;

    var fromColor = 'silver';
    if (fromChara.Level == 2)
      fromColor = 'gold';
    else if (toChara.Level == 3)
      fromColor = 'purple';

    var fromCover = normalizeAvatar(fromChara.Cover);
    var toCover = getLargeCover(toChara.Icon);

    var assets = `<div class="asset" title="固定资产 / 重组数量">${fromChara.Assets} / ${fromChara.Sacrifices}</div>`;
    var assets2 = `<div class="asset" title="可用数量 / 重组数量">${toChara.UserAmount} / ${toChara.Sacrifices}</div>`;

    var max = toChara.Sacrifices - toChara.Assets;
    if (max > fromChara.UserAmount)
      max = fromChara.UserAmount;

    var option = '<div class="option"><div id="templeButton" class="checkbox">消耗圣殿<span class="slider"><span class="button"></span></span></div></div>';

    if (fromChara.UserAmount == 0 && fromChara.UserTotal == 0 && fromChara.Sacrifices == 0) {
      content = `<div class="content">所选目标没有资产</div>`;
    }
    else {
      content = `<div class="chara_convert">
    <div class="left item">
      <div class="container card" style="background-image:url(${fromCover})"></div>
      ${assets}
    </div>
    <div class="arrow_right"></div>
    <div class="right item ${toColor}">
      <div class="container avatar" style="background-image:url(${toCover})"></div>
      ${assets2}
    </div>
  </div>
  <div class="content"><span>消耗「${fromChara.Name}」100固定资产获取「${toChara.Name}」的随机数量（10-100）股份</span></div>
  <div data-from-id="${fromChara.CharacterId}" data-to-id="${toChara.Id}" class="button active guide_button">POST</div>`;
    }
  }

  var dialog = `<div class="new_overlay" id="confirmCharacterDialog">
  <div class="new_dialog">
    <div id="grailBox">
      <div class="title">${title}</div>
      ${content}
      <div class="loading" style="display:none"></div>
    </div>
    <a class="close_button" title="Close">X关闭</a>
  </div></div>`;

  $('body').append(dialog);

  $('#confirmCharacterDialog .link_button').on('click', (e) => {
    var toCharaId = $(e.currentTarget).data('to-id');
    var fromCharaId = $(e.currentTarget).data('from-id');
    postData(`chara/link/${fromCharaId}/${toCharaId}`, null, (d) => {
      if (d.State == 0) {
        alert('连接成功');
        closeNewDialog('#confirmCharacterDialog');
        closeNewDialog('#searchDialog');
        //window.location.reload();
      } else {
        alert(d.Message);
      }
    });
  });

  $('#confirmCharacterDialog .guide_button').on('click', (e) => {
    var toCharaId = $(e.currentTarget).data('to-id');
    var fromCharaId = $(e.currentTarget).data('from-id');
    postData(`magic/guidepost/${fromCharaId}/${toCharaId}`, null, (d) => {
      if (d.State == 0) {
        var count = d.Value.Amount;
        var price = formatNumber(count * d.Value.SellPrice, 0);
        alert(`成功获取「${toChara.Name}」${count}股，市值₵${price}`);
        closeNewDialog('#confirmCharacterDialog');
        closeNewDialog('#searchDialog');
        //window.location.reload();
      } else {
        alert(d.Message);
      }
    });
  });

  $('#confirmCharacterDialog .convert_button').on('click', (e) => {
    var toCharaId = $(e.currentTarget).data('to-id');
    var fromCharaId = $(e.currentTarget).data('from-id');
    var isTemple = $('#templeButton').hasClass('on');
    var amount = $('.content input').val();
    postData(`magic/stardust/${fromCharaId}/${toCharaId}/${amount}/${isTemple}`, null, (d) => {
      if (d.State == 0) {
        alert('充能完成');
        closeNewDialog('#confirmCharacterDialog');
        closeNewDialog('#searchDialog');
        //window.location.reload();
      } else {
        alert(d.Message);
      }
    });
  });

  $('#templeButton').on('click', (e) => {
    if ($('#templeButton').hasClass('on')) {
      $('#templeButton').removeClass('on');
      $('#templeButton .button').animate({ 'margin-left': '0px' });
      $('#templeButton .button').css('background-color', '#ccc');
    } else {
      $('#templeButton').addClass('on');
      $('#templeButton .button').animate({ 'margin-left': '20px' });
      $('#templeButton .button').css('background-color', '#7fc3ff');
      $('.content input').val(amount);
    }
  });

  $('body').css('overflow-y', 'hidden');
  addCloseDialog('#confirmCharacterDialog');
}

function renderLink(temple1, temple2, small) {
  var left = temple1;
  var right = temple2;

  if (!left || !right)
    return null;

  if (temple1.Sacrifices < temple2.Sacrifices) {
    right = temple1;
    left = temple2;
  }

  var leftCover = getLargeCover(left.Cover);
  var rightCover = getLargeCover(right.Cover);

  if (small) {
    leftCover = getSmallCover(left.Cover);
    rightCover = getSmallCover(right.Cover);
  }

  var leftName = left.CharacterName;
  var rightName = right.CharacterName;

  if (!leftName)
    leftName = left.Name;

  if (!rightName)
    rightName = right.Name;

  var leftColor = 'silver';
  if (left.Level == 2)
    leftColor = 'gold';
  else if (left.Level == 3)
    leftColor = 'purple';

  var rightColor = 'silver';
  if (right.Level == 2)
    rightColor = 'gold';
  else if (right.Level == 3)
    rightColor = 'purple';

  var content = `<div class="chara_link">
    <div class="left item ${leftColor}">
      <div data-id="${left.CharacterId}" class="container card" style="background-image:url(${leftCover})"></div>
    </div>
    <div class="right item ${rightColor}">
      <div data-id="${right.CharacterId}" class="container card" style="background-image:url(${rightCover})"></div>
    </div>
  </div>
  <div class="content"><span data-id="${left.CharacterId}">「${leftName}」</span>×<span data-id="${right.CharacterId}">「${rightName}」</span></div>`;
  return content;
}

function renderTempleListItem(chara) {
  var cover = chara.Avatar;
  if (!cover) cover = chara.Cover;
  cover = getSmallCover(cover);

  var color = 'silver';
  if (chara.Level == 2)
    color = 'gold';
  else if (chara.Level == 3)
    color = 'purple';

  var badge = `<span class="badge level lv${chara.CharacterLevel}">lv${chara.CharacterLevel}</span>`;
  var link = `<span class="unlinked">NO LINK</span>`;
  if (chara.Link) {
    link = `<span class="link">×「${chara.Link.Name}」</span>`;
  }

  var item = `<div data-id="${chara.CharacterId}" class="chara_item item ${color}">
    <div class="avatar card" style="background-image:url(${cover})">
      <div class="tag">${chara.Level}</div>
    </div>
    <div class="info">
      <div class="name large">${badge}#${chara.CharacterId}「${chara.Name}」${link}</div>
      <div class="asset">${chara.Assets} / ${chara.Sacrifices}</div>
    </div>
  </div>`;

  return item;
}

function renderCharacterListItem(chara) {
  var cover = normalizeAvatar(chara.Icon);
  var badge = `<span class="badge level lv${chara.Level}">lv${chara.Level}</span>`;

  var assets = `<div class="asset" title="可用 / 持股 / 重组">${chara.UserAmount} / ${chara.UserTotal} / ${chara.Sacrifices}</div>`;
  if (chara.UserAmount == 0 && chara.UserTotal == 0)
    assets = `<div class="asset"><span class="no_assets">暂无持股</span></div>`;

  var item = `<div data-id="${chara.Id}" class="chara_item">
    <div class="avatar card" style="background-image:url(${cover})">
    </div>
    <div class="info">
      <div class="name large">${badge}#${chara.Id}「${chara.Name}」</div>
      ${assets}
    </div>
  </div>`;

  return item;
}

function openBackgroundDialog() {
  var title = `小圣杯「LINK」主题壁纸`;

  var dialog = `<div class="new_overlay" id="backgroundDialog">
  <div class="new_dialog">
    <div class="title">${title}</div>
    <div class="container">
      <img src="https://tinygrail.mange.cn/senken/tinygrail_wallpaper.png!w960" alt="小圣杯「LINK」主题壁纸" />
    </div>
    <div class="action">
      <div><a href="/rakuen/topic/group/358777" target="right">[讨论]</a></div>
      <div><a href="https://tinygrail.mange.cn/senken/tinygrail_wallpaper_1440.zip" target="_blank">[下载]</div>
      <div><a href="#" id="noMoreTip">[不再提醒]</a></div>
    </div>
    <a class="close_button" title="Close">X关闭</a>
  </div></div>`;

  $('body').append(dialog);
  $('body').css('overflow-y', 'hidden');

  $('#noMoreTip').on('click', (e) => {
    localStorage.setItem('openBackgroundDialog', 'false');
    closeNewDialog('#backgroundDialog');
  });

  addCloseDialog('#backgroundDialog');
}

function addCloseDialog(id) {
  if (!id.startsWith('#'))
    id = '#' + id;

  $(`${id} .close_button`).on('click', () => {
    closeNewDialog(id);
  });
}

function closeNewDialog(id) {
  if (!id.startsWith('#'))
    id = '#' + id;

  $(id).remove();
  if ($('.new_overlay').length == 0)
    $('body').css('overflow-y', 'scroll');
}

function loadTopRecords(page, callback) {
  // var top = `<div id="topWeekRecords" class="temples tab_page_item tab_page_item_0">
  // <div class="title">/ 萌王记录</div>
  // <div class="loading"></div>
  // </div>`;
  // $('#topWeek').after(top);
  $('#topWeek .loading').show();
  getData(`chara/topweek/history/${page}`, d => {
    //var index = 1;
    $('#topWeek .loading').hide();
    d.Value.Items.forEach(chara => {
      var date = new Date(chara.Create);
      var week = getWeek(date);
      var year = date.getFullYear();

      if ($(`#topWeek .week${week}`).length == 0) {
        $(`#topWeek .loading`).before(`<div class="week${week} record">
          <div class="week">${year}年第${week}周</div>
          <div class="scroller">
            <div class="list"></div>
          </div>
        </div>`);
      }

      var name = `${chara.Level} ${chara.Name}`;
      if (chara.Level > 3)
        name = chara.Name;

      var avatar = normalizeAvatar(chara.Avatar);
      var title = `+₵${formatNumber(chara.Extra, 0)} / ₵${formatNumber(chara.Price, 0)} / ${formatNumber(chara.Assets, 0)}`;
      var item = `<div class="chara rank${chara.Level}" data-id="${chara.CharacterId}" title="${title}">
        <div class="avatar" style="background-image:url(${avatar})">
          <span class="level badge lv${chara.CharacterLevel}">lv${chara.CharacterLevel}</span>
        </div>
        <div class="name">${name}</div>
      </div>`;
      $(`#topWeek .week${week} .list`).prepend(item);
      //$(`#topWeekRecords .week${week} .list`).prepend(item);
    });

    if (callback) callback();

    $('#loadMoreButton3').remove();
    if (d.Value.CurrentPage != d.Value.TotalPages) {
      var loadMore = `<div class="center_button tab_page_item tab_page_item_0"><button id="loadMoreButton3" data-page="${page + 1}" class="load_more_button">[加载更多...]</button></div>`
      $("#topWeek").after(loadMore);
      $('#loadMoreButton3').on('click', e => {
        var mpage = $(e.currentTarget).data('page');
        loadTopRecords(mpage);
      });
    }
  });
}

function getWeek(dt) {
  let d1 = new Date(dt);
  let d2 = new Date(dt);
  d2.setMonth(0);
  d2.setDate(1);
  let rq = d1 - d2;
  let days = Math.ceil(rq / (24 * 60 * 60 * 1000));
  let num = Math.ceil(days / 7);
  return num;
}

function loadTopWeek(callback) {
  var top = `<div id="topWeek" class="temples tab_page_item tab_page_item_0">
    <div class="title">/ 每周萌王</div>
    <div class="scroller">
      <div class="assets"></div>
    </div>
    <div class="loading"></div>
  </div>`;
  $('#lastLinks').after(top);

  getData(`chara/topweek`, d => {
    var index = 1;
    d.Value.forEach(temple => {
      temple.Index = index++;
      var card = renderTemple(temple, 'extra');
      $('#topWeek .assets').append(card);
      $(`#topWeek .item .card[data-id="${temple.UserId}#${temple.CharacterId}"]`).data('temple', temple);
    });
    $('#topWeek').on('click', '.auction_button', e => {
      var cid = $(e.currentTarget).data('id');
      var temple = d.Value.find(t => t.CharacterId == cid);
      var chara = { Id: cid };
      chara.State = temple.Sacrifices;
      chara.Name = temple.CharacterName;
      chara.Price = temple.Price;
      chara.Total = 0;

      openAuctionDialog(chara);
    });
    if (callback) callback();
  });
}

function loadLastLinks(page, callback) {
  if ($('#lastLinks').length == 0) {
    var next = '<button id="prevButton" class="load_more_button">[上一页]</button>';
    var prev = '<button id="nextButton" class="load_more_button">[下一页]</button>';
    var buttons = `<div class="buttons">${next}${prev}</div>`;
    var last = `<div id="lastLinks" class="temples tab_page_item tab_page_item_0">
      <div class="title">/ 最新连接</div>
      <div class="scroller">
        <div class="assets"></div>
      </div>
      ${buttons}
    </div>`;
    $('#grailIndexTab2').after(last);
    $('#lastLinks #nextButton').on('click', e => {
      var mpage = $('#lastLinks').data('page');
      loadLastLinks(mpage + 1);
    });
    $('#lastLinks #prevButton').on('click', e => {
      var mpage = $('#lastLinks').data('page');
      loadLastLinks(mpage - 1);
    });
  }

  $('#lastLinks').data('page', page);

  if (page == 1)
    $('#lastLinks #prevButton').hide();
  else
    $('#lastLinks #prevButton').show();

  getData(`chara/link/last/${page}/16`, d => {
    $('#lastLinks .assets').empty();
    if (page == d.Value.TotalPages)
      $('#lastLinks #nextButton').hide();
    else
      $('#lastLinks #nextButton').show();

    for (var i = 0; i < d.Value.Items.length; i += 2) {
      var t1 = d.Value.Items[i];
      var t2 = d.Value.Items[i + 1];
      var assets = Math.min(t1.Assets, t2.Assets);
      var card = renderLink(t1, t2, true);
      if (card != null)
        $('#lastLinks .assets').append(`<div class="link item">${card}<div class="name"><a target="_blank" title="${t1.Nickname}" href="/user/${t1.Name}">@${t1.Nickname} +${formatNumber(assets, 0)}</a></div></div>`);
      $(`#lastLinks .assets .item .card[data-id="${t1.CharacterId}"]`).data('temple', t1);
      $(`#lastLinks .assets .item .card[data-id="${t2.CharacterId}"]`).data('temple', t2);
    }

    if (callback) callback();
  });
}

function loadLastTemples(page, callback) {
  if ($('#lastTemples').length == 0) {
    var next = '<button id="prevButton" class="load_more_button">[上一页]</button>';
    var prev = '<button id="nextButton" class="load_more_button">[下一页]</button>';
    var buttons = `<div class="buttons">${next}${prev}</div>`;
    var last = `<div id="lastTemples" class="temples tab_page_item tab_page_item_0">
      <div class="title">/ 最新圣殿</div>
      <div class="scroller">
        <div class="assets"></div>
      </div>
      ${buttons}
    </div>`;
    $('#topWeek').after(last);
    $('#lastTemples #nextButton').on('click', e => {
      var mpage = $('#lastTemples').data('page');
      loadLastTemples(mpage + 1);
    });
    $('#lastTemples #prevButton').on('click', e => {
      var mpage = $('#lastTemples').data('page');
      loadLastTemples(mpage - 1);
    });
  }

  $('#lastTemples').data('page', page);

  if (page == 1)
    $('#lastTemples #prevButton').hide();
  else
    $('#lastTemples #prevButton').show();

  getData(`chara/temple/last/${page}/14`, d => {
    $('#lastTemples .assets').empty();
    if (page == d.Value.TotalPages)
      $('#lastTemples #nextButton').hide();
    else
      $('#lastTemples #nextButton').show();
    d.Value.Items.forEach(temple => {
      var card = renderTemple(temple, 'new');
      $('#lastTemples .assets').append(card);
      $(`#lastTemples .assets .item .card[data-id="${temple.UserId}#${temple.CharacterId}"]`).data('temple', temple);
    });

    if (callback) callback();
  });
}

path = window.location.pathname;
if (path.startsWith('/character/')) {
  cid = path.match(/\/character\/(\d+)/)[1];
  loadGrailBox(cid);
  reverseComments();
} else if (path.startsWith('/rakuen/topic/crt/')) {
  cid = path.match(/\/rakuen\/topic\/crt\/(\d+)/)[1];
  loadTinyBox(cid, function (item) {
    if (window.location.search.indexOf('trade=true') >= 0) {
      $('#grailBox').remove();
      $("#subject_info .board").after(`<div id="grailBox" class="chara${cid}"><div class="loading"></div></div>`);
      if (item.CharacterId)
        loadICOBox(item);
      else
        loadTradeBox(item);
    }
  });
  reverseComments();
} else if (path.startsWith('/rakuen/home')) {
  if (parent.document.querySelector('html[data-theme=dark]'))
    $(document).find('html').attr('data-theme', 'dark');

  $('body').css('padding', '0 0 20px 0');

  $('body').on('click', '.initial_item a.avatar', characterNameClicked);
  $('body').on('click', '.temples .item .card', templeCardClicked);
  $('body').on('click', '.temples .item .title', characterNameClicked);
  $('body').on('click', '#topWeek .chara', characterNameClicked);

  $('body').empty();

  loadGrailBox2(() => {
    loadNewTab();
    loadLastLinks(1, () => {
      loadTopWeek(() => {
        loadLastTemples(1, () => {
          loadTopRecords(1);
        });
      });
      $('#lastLinks').on('click', '.link .content span', characterNameClicked);
    });
  });
} else if (path.startsWith('/user/')) {
  var id = path.split('?')[0].substr(6);
  loadUserPage(id);
} else if (path.startsWith('/rakuen/topiclist')) {
  fixMobilePage();
  loadGrailMenu();
  var ids = [];
  var list = {};
  var items = $('#eden_tpc_list .item_list');
  for (i = 0; i < items.length; i++) {
    var item = items[i];
    var link = $(item).find('a').attr('href');
    item.link = link;
    item.onclick = function () {
      if (parent.window.innerWidth < 1200) {
        $(parent.document.body).find("#split #listFrameWrapper").animate({ left: '-450px' });
      }
      window.open(this.link, 'right');
    };
    if (link.startsWith('/rakuen/topic/crt/')) {
      var id = link.substr(18);
      ids.push(parseInt(id));
      list[id] = item;
    }
  }
  postData('chara/list', ids, function (d, s) {
    if (d.State === 0) {
      for (i = 0; i < d.Value.length; i++) {
        var item = d.Value[i];
        var pre = caculateICO(item);
        if (item.CharacterId) {
          var id = item.CharacterId;
          var percent = formatNumber(item.Total / pre.Next * 100, 0);
          $(list[id]).append(`<div class="tags tag lv${pre.Level}" title="${formatNumber(item.Total, 0)}/100,000 ${percent}%">ICO进行中</div>`);
        } else {
          var id = item.Id;
          $(list[id]).find('a.avatar>span').css('background-image', `url(${normalizeAvatar(item.Icon)})`);
          addCharacterTag(item, list[id]);
        }
      }
    }
  });
}