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
//var api = 'https://localhost:5001/api/';
var box = `<div id="grailBox"><div class="loading"></div></div>`;
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
    $('#columnCrtB>.clearit').after(box);
  } else {
    if ($('#tradeDialog').length > 0)
      $('#tradeDialog').append(box);
    else
      $("#subject_info .board").after(box);
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
  $('#grailBox').html(box);
  $('#grailBox').addClass('chara' + chara.Id);
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
      var badge = renderBadge(chara);
      var userChara = d.Value;

      var box = `<div class="title"><button id="kChartButton" class="text_button">[K线图]</button><div class="text" title="现价 / 流通 / 持有">#${chara.Id} -「${chara.Name}」₵${formatNumber(chara.Current, 2)} / ${formatNumber(chara.Total, 0)} / ${formatNumber(d.Value.Amount, 0)}<span class="tag ${fclass}">${flu}</span>${badge}</div><div class="balance">账户余额：<span>₵${formatNumber(d.Value.Balance, 2)}</span></div></div>
     <div class="trade_box">
        <div class="bid">
          <div class="title"><span>价格 / 数量 / 总计</span><span class="label">买入委托</span></div>
          <ul class="bid_list list"></ul>
          <div class="trade_list">
            <div><div class="label">单价</div><input class="price" type="number" min="1" value="${Math.ceil(chara.Current)}"></input></div>
            <div><div class="label">数量</div><input class="amount" type="number" min="1" value="10"></input></div>
            <div><div class="label total">-${formatNumber(Math.ceil(chara.Current) * 10, 2)}</div><button id="bidButton" class="active bid">买入</button></div>
          </div>
        </div>
        <div class="ask">
          <div class="title"><span>价格 / 数量 / 总计</span><span class="label">卖出委托</span></div>
          <ul class="ask_list list"></ul>
          <div class="trade_list">
            <div><div class="label">单价</div><input class="price" type="number" min="1" max="100000" value="${Math.floor(chara.Current)}"></input></div>
            <div><div class="label">数量</div><input class="amount" type="number" min="1" value="10"></input></div>
            <div><div class="label total">+${formatNumber(Math.floor(chara.Current) * 10, 2)}</div><button id="askButton" class="active ask">卖出</button></div>
          </div>
        </div>
        <div class="depth">
          <div class="title"><span class="label">深度信息</span></div>
          <ul class="ask_depth"></ul>
          <ul class="bid_depth"></ul>
        </div>
      </div><div class="loading"></div>`

      $('#grailBox').html(box);
      for (i = 0; i < d.Value.AskHistory.length; i++) {
        var ask = d.Value.AskHistory[i];
        $('.ask .ask_list').prepend(`<li title="${formatDate(ask.TradeTime)}">₵${formatNumber(ask.Price, 2)} / ${formatNumber(ask.Amount, 0)} / +${formatNumber(ask.Amount * ask.Price, 2)}<span class="cancel">[成交]</span></li>`);
      }
      for (i = 0; i < d.Value.Asks.length; i++) {
        var ask = d.Value.Asks[i];
        $('.ask .ask_list').append(`<li title="${formatDate(ask.Begin)}" class="ask">₵${formatNumber(ask.Price, 2)} / ${formatNumber(ask.Amount, 0)} / +${formatNumber(ask.Amount * ask.Price, 2)}<span class="cancel" data-id="${ask.Id}">[取消]</span></li>`);
      }
      for (i = 0; i < d.Value.BidHistory.length; i++) {
        var bid = d.Value.BidHistory[i];
        $('.bid .bid_list').prepend(`<li title="${formatDate(bid.TradeTime)}">₵${formatNumber(bid.Price, 2)} / ${formatNumber(bid.Amount, 0)} / -${formatNumber(bid.Amount * bid.Price, 2)}<span class="cancel">[成交]</span></li>`);
      }
      for (i = 0; i < d.Value.Bids.length; i++) {
        var bid = d.Value.Bids[i];
        $('.bid .bid_list').append(`<li title="${formatDate(bid.Begin)}" class="bid">₵${formatNumber(bid.Price, 2)} / ${formatNumber(bid.Amount, 0)} / -${formatNumber(bid.Amount * bid.Price, 2)}<span class="cancel" data-id="${bid.Id}">[取消]</span></li>`);
      }

      $('#bidButton').on('click', function () {
        var price = $('.bid .price').val();
        var amount = $('.bid .amount').val();
        postData(`chara/bid/${chara.Id}/${price}/${amount}`, null, function (d, s) {
          if (d.Message)
            alert(d.Message);
          loadGrailBox(chara.Id, loadTradeBox);
        });
      });

      $('#askButton').on('click', function () {
        var price = $('.ask .price').val();
        var amount = $('.ask .amount').val();
        postData(`chara/ask/${chara.Id}/${price}/${amount}`, null, function (d, s) {
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

      loadFixedAssets(chara, userChara, () => {
        loadBoardMember(chara.Id, 1, chara.Total, function (modifiers) {
          getData(`chara/pool/${chara.Id}`, d2 => {
            if (d2.State == 0) {
              $('#grailBox .board_box .desc .bold .sub').after(`<span title="彩票奖池" class="sub"> / ${formatNumber(d2.Value, 0)}</span>`);
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
                $('.board_box .desc').append('<button id="iconButton" class="text_button">[更换头像]</button>');
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
            $('.depth .ask_depth').prepend(`<li data-price="${ask.Price}"><div style="width:${p}%"></div><span>₵${formatNumber(ask.Price, 2)} / ${formatNumber(ask.Amount, 0)}</span></li>`);
          }
          for (i = 0; i < d2.Value.Bids.length; i++) {
            var bid = d2.Value.Bids[i];
            var p = Math.ceil(bid.Amount / max * 100);
            $('.depth .bid_depth').append(`<li data-price="${bid.Price}"><div style="width:${p}%"></div><span>₵${formatNumber(bid.Price, 2)} / ${formatNumber(bid.Amount, 0)}</span></li>`);
          }

          $('.depth .ask_depth li').on('click', function () {
            var price = $(this).data('price');
            $('.bid .price').val(price);
            $('.bid .amount').select();
            caculateTotal();
          });

          $('.depth .bid_depth li').on('click', function () {
            var price = $(this).data('price');
            $('.ask .price').val(price);
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

function loadFixedAssets(chara, userChara, callback) {
  getData(`chara/temple/${chara.Id}`, function (d) {
    if (d.State === 0) {
      var box = `<div class="assets_box"><div class="desc"><div class="bold">固定资产 ${d.Value.length}<span class="sub"> / +${formatNumber(chara.Rate, 2)}</span></div><button id="auctionHistoryButton" class="text_button">[上期公示]</button><button id="buildButton" class="text_button">[资产重组]</button></div><div class="assets"></div></div>`;
      $('#grailBox .loading').before(box);
      $('#buildButton').on('click', () => {
        openSacrificeDialog(chara, userChara.Amount);
      });
      $('#auctionHistoryButton').on('click', () => {
        openHistoryDialog(chara);
      });

      getGameMaster((result) => {
        if (result) {
          $('.assets_box .desc').append('<button id="tradeHistoryButton" class="text_button">[交易记录]</button>');
          $('#tradeHistoryButton').on('click', () => {
            openTradeHistoryDialog(chara);
          });
        }
      });

      var temples = {};
      for (i = 0; i < d.Value.length; i++) {
        var temple = d.Value[i];
        temples[temple.UserId] = temple;

        var cover = getSmallCover(temple.Cover);
        var avatar = normalizeAvatar(temple.Avatar);

        var name = '光辉圣殿';
        var rate = '+0.20';
        var full = formatNumber(temple.Sacrifices, 0);

        if (temple.Level == 2) {
          name = '闪耀圣殿';
          rate = '+0.30';
        } else if (temple.Level == 3) {
          name = '奇迹圣殿';
          rate = '+0.60';
        }

        var card = `<div class="item">
          <div class="card" data-id="${temple.UserId}" style="background-image:url(${cover})">
            <div class="tag"><span>${temple.Level}</span></div>
            <div class="buff">${rate}</div>
          </div>
          <div class="title">
            <span title="${name} ${formatNumber(temple.Assets, 0)} / ${full}">${name} ${formatNumber(temple.Assets, 0)} / ${full}</span>
          </div>
          <div class="name">
            <a target="_blank" title="${temple.Nickname}" href="/user/${temple.Name}">@${temple.Nickname}</a>
          </div>
        </div>`
        $('.assets_box .assets').append(card);
      }

      $('#grailBox .item .card').on('click', (e) => {
        var uid = $(e.currentTarget).data('id');
        var temple = temples[uid];
        showTemple(temple, chara);
      });

      if (d.Value.length === 0) {
        var card = '<div class="empty">啊咧？啥都没有~( T oT)//</div>';
        $('.assets_box .assets').append(card);
      }

      getData(`chara/user/${chara.Id}/valhalla@tinygrail.com/false`, (d) => {
        if (d.State == 0 && d.Value.Amount > 0) {
          chara.Price = d.Value.Price;
          chara.State = d.Value.Amount;
          var button = `<button id="auctionButton" class="text_button">[参与竞拍]</button>`;
          $('#buildButton').before(button);
          $('#auctionButton').on('click', () => {
            openAuctionDialog(chara);
          });
        }
      });
    }
    if (callback) callback();
  });
}

function renderTemple(temple) {
  var cover = getSmallCover(temple.Cover);
  var avatar = normalizeAvatar(temple.Avatar);
  var name = '光辉圣殿';
  var rate = '+0.20';
  var full = formatNumber(temple.Sacrifices, 0);

  if (temple.Level == 2) {
    name = '闪耀圣殿';
    var rate = '+0.30';
  } else if (temple.Level == 3) {
    name = '奇迹圣殿';
    var rate = '+0.60';
  }

  var card = `<div class="item">
          <div class="card" data-id="${temple.CharacterId}" style="background-image:url(${cover})">
            <div class="tag"><span>${temple.Level}</span></div>
            <div class="buff">+${formatNumber(temple.Rate, 2)}</div>
          </div>
          <div class="name" title="${temple.Name}">
            <span><a href="/character/${temple.CharacterId}" target="_blank">${temple.Name}</a></span>
          </div>
          <div class="title">
            <span title="${rate} / ${formatNumber(temple.Assets, 0)} / ${full}">${name} ${formatNumber(temple.Assets, 0)} / ${full}</span>
          </div>
        </div>`

  return card;
}

function sacrificeCharacter(id, count, captial, callback) {
  postData(`chara/sacrifice/${id}/${count}/${captial}`, null, (d) => {
    if (callback) { callback(d); }
  });
}

function showTemple(temple, chara) {
  var cover = getLargeCover(temple.Cover);
  var action = `<div class="action">
      <button style="display:none" id="changeCoverButton" class="text_button">[修改]</button>
      <button style="display:none" id="resetCoverButton" class="text_button">[重置]</button>
      <input style="display:none" id="picture" type="file" accept="image/*">
    </div>`;
  // if (temple.UserId == userId) {
  //   $('#changeCoverButton').show();
  //   $('#resetCoverButton').show();
  // } else {
  //   getGameMaster((r) => {
  //     $('#resetCoverButton').show();
  //   });
  // }

  getUserAssets((d) => {
    if (d.State == 0) {
      if (d.Value.Id == temple.UserId) {
        $('#changeCoverButton').show();
        $('#resetCoverButton').show();
      }
      if (d.Value.Type >= 999 || d.Value.Id == 702) {
        $('#resetCoverButton').show();
      }
    }
  });

  var position = '';
  if (cover.indexOf('//lain.') >= 0)
    position = 'background-position:top;';

  //var image=`<div class="card" style="background-image:url(${cover});${position}">`;
  var image = `<img class="cover" src='${cover}' />`;

  var dialog = `<div id="TB_overlay" class="TB_overlayBG TB_overlayActive"></div>
  <div id="TB_window" class="dialog temple" style="display:block;">
      ${image}
      ${action}
      <div class="loading" style="display:none;"></div>
      <a id="TB_closeWindowButton" title="Close">X关闭</a>
    </div>
  </div>`;
  $('body').append(dialog);

  $('#TB_closeWindowButton').on('click', closeDialog);
  $('#TB_window.temple img.cover').on('click', closeDialog);
  $('#TB_window.temple').on('click', '.card', closeDialog);

  $('#changeCoverButton').on('click', (e) => {
    $("#picture").click();
    e.stopPropagation();
  });
  $('#resetCoverButton').on('click', (e) => {
    resetTempleCover(temple);
    e.stopPropagation();
  });
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

  if (cover.indexOf('tinygrail.') >= 0)
    return cover + '!w480';

  return cover;
}

function getSmallCover(cover) {
  if (cover.indexOf('/crt/g/') >= 0)
    return cover.replace('/g/', '/m/');

  if (cover.indexOf('tinygrail.') >= 0)
    return cover + '!w150';

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
  <div id="TB_window" class="dialog">
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
      $('#TB_window .desc').text('将股份出售给英灵殿，立刻获取现金。输入股权融资的数量：');
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
          <span class="fit" title="对象 / 类型">#${a.RelatedId} / ${a.Type}</span>
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
        $('#grailBox .loading').before(box);
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



        var u = `<div class="user ${inactive}">
      <a target="_blank" href="/user/${user.Name}"><img src="${avatar}"></a>
        <div class="name">
          <a target="_blank" title="${user.Nickname}${banned}" href="/user/${user.Name}"><span class="title">${title}</span>${user.Nickname}</a>
          <div class="${tag}">${amount} ${p}%</div>
        </div></div>`
        $('.board_box .users').append(u);

        index++;
      }

      if (callback) callback(modifiers);

      $('#grailBox .center_button').remove();
      if (d.Value.CurrentPage < d.Value.TotalPages) {
        var loadMore = `<div class="center_button"><button id="loadMoreButton" data-page="${d.Value.CurrentPage + 1}" class="load_more_button">[加载更多...]</button></div>`
        $("#grailBox .board_box").after(loadMore);
        $('#loadMoreButton').on('click', (e) => {
          var p = $(e.target).data('page');
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
          $("#subject_info .board").after(box);
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
          $("#subject_info .board").after(box);
          loadTradeBox(item);
        });
      }
      if (callback) callback(item);
    } else {
      $('#pageHeader').append(`<button id="openTradeButton" class="tag active">启动ICO</button>`);
      $('#openTradeButton').on('click', function () {
        $('#grailBox').remove();
        $("#subject_info .board").after(box);
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

  var box = `<div class="title"><div class="text">#${ico.CharacterId} -「${ico.Name}」 ICO进行中${badge}</div> <div class="balance"></div></div>
      <div class="desc">
        <div class="bold">已筹集 ₵${formatNumber(ico.Total, 0)} / <span class="sub">下一等级需要₵${formatNumber(predicted.Next, 0)}</span></div>
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
        var desc = `<div class="desc"><div class="bold">参与者 ${d.Value.TotalItems} / <span class="sub">10</span></div></div><div class="users"></div>`;
        $('#grailBox').append(desc);
        for (i = 0; i < d.Value.Items.length; i++) {
          var icu = d.Value.Items[i];
          var index = (d.Value.CurrentPage - 1) * 10 + i;
          var user = RenderInitialUser(icu, index);
          $("#grailBox .users").append(user);
        }
        if (d.Value.TotalPages > 1) {
          var loadMore = `<div class="center_button"><button id="loadMoreButton" class="load_more_button">[加载更多...]</button></div>`
          $("#grailBox .users").after(loadMore);
          $("#loadMoreButton").data('page', 2);
          $("#loadMoreButton").on('click', function () {
            var page = $("#loadMoreButton").data('page');
            getInitialUsers(ico.Id, page, function (d, s) {
              if (d.State === 0) {
                for (i = 0; i < d.Value.Items.length; i++) {
                  var icu = d.Value.Items[i];
                  var index = (d.Value.CurrentPage - 1) * 10 + i;
                  var user = RenderInitialUser(icu, index);
                  $("#grailBox .users").append(user);
                }
              }
              $("#loadMoreButton").data('page', page + 1);
              if (d.Value.CurrentPage >= d.Value.TotalPages)
                $(".center_button").hide();
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
      <div class="trade"><input class="money" type="number" min="1000" value="1000"></input><button id="appendICOButton" class="active">确定</button><button id="cancelICOButton">取消</button></div>`;
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

  var user = `<div class="user">
      <a target="_blank" href="/user/${icu.Name}"><img src="${avatar}"></a>
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
  var login = 'https://bgm.tv/oauth/authorize?response_type=code&client_id=bgm2525b0e4c7d93fec&redirect_uri=https%3A%2F%2Ftinygrail.com%2Fcb';
  window.open(login);
}

function logout(callback) {
  postData('account/logout', null, callback);
}

function normalizeAvatar(avatar) {
  if (!avatar) return '//lain.bgm.tv/pic/user/l/icon.jpg';

  if (avatar.startsWith('https://tinygrail.oss-cn-hangzhou.aliyuncs.com/'))
    return avatar + "!w120";

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
  if (!confirm('请注意，领取签到奖励之后本周将不能再领取股息分红。')) return;

  getData(`event/bangumi/bonus/daily`, function (d, s) {
    if (d.State == 0)
      alert(d.Value);
    else
      alert(d.Message);

    callback();
  });
}

function getWeeklyShareBonus(callback) {
  if (!confirm('请注意，领取股息分红之后本周将不能再领取登录奖励，股息预测小于₵10,000建议每日签到。')) return;

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

  getData(`chara/user/assets/${name}`, function (d, s) {
    if (d.State === 0) {
      var data = d.Value;
      $('h1.nameSingle .inner small.grey').after(`<button id="recommendButton" class="text_button">[推荐关系]</button>`);
      $('#recommendButton').on('click', (e) => {
        openRecommendDialog(d.Value.Id, name);
      });

      if (data.State == 666)
        $('h1.nameSingle .inner small.grey').after('<small class="red">[小圣杯已封禁]</small>');

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

          if (result.Id == 702) {
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
        }
      });

      var box = `<div id="grail" class="sort" data-id="${d.Value.Id}">
      <div class="horizontalOptions clearit">
        <ul class="">
          <li class="title"><h2>${title} </h2></li>
          <li id="templeTab" class="current"><a>0座圣殿</a></li>
          <li id="charaTab"><a>0个人物</a></li>
          <li id="initTab"><a>0个ICO</a></li>
          <li class="total"></li>
        </ul>
      </div>
      <div class="clearit">
        <div class="temple_list">
          <div class="loading"></div>
        </div>
        <div class="chara_list" style="display:none">
          <div class="loading"></div>
        </div>
        <div class="init_list" style="display:none">
          <div class="loading"></div>
        </div>
      </div>
      </div>`;
      $('#user_home .user_box').after(box);

      loadUserTemples(1);
      loadUserCharacters(1);
      loadUserInitials(1);

      $('#grail .total').text(`总资产：₵${formatNumber(data.Assets, 2)} / ${formatNumber(data.Balance, 2)}`);

      $('#initTab').on('click', function () {
        $('#templeTab').removeClass('current');
        $('#initTab').addClass('current');
        $('#charaTab').removeClass('current');
        $('.chara_list').hide();
        $('.temple_list').hide();
        $('.init_list').show();
        $('#pager1').hide();
        $('#pager2').hide();
        $('#pager3').show();
      });

      $('#charaTab').on('click', function () {
        $('#templeTab').removeClass('current');
        $('#initTab').removeClass('current');
        $('#charaTab').addClass('current');
        $('.chara_list').show();
        $('.temple_list').hide();
        $('.init_list').hide();
        $('#pager1').hide();
        $('#pager2').show();
        $('#pager3').hide();
      });

      $('#templeTab').on('click', function () {
        $('#templeTab').addClass('current');
        $('#initTab').removeClass('current');
        $('#charaTab').removeClass('current');
        $('.chara_list').hide();
        $('.temple_list').show();
        $('.init_list').hide();
        $('#pager1').show();
        $('#pager2').hide();
        $('#pager3').hide();
      });
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
        var item = renderTemple(data.Value.Items[i]);
        $(`#grail .temple_list .page${page}`).append(item);
      }

      $(`#grail .temple_list .page${page} .item .card`).on('click', (e) => {
        var cid = $(e.currentTarget).data('id');
        var temple = data.Value.Items.find((t) => { return t.CharacterId == cid; });
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

  var badge = '';
  // if (item.LastIndex != 0)
  //   badge = `<span class="badge" title="昨日排名第${item.LastIndex}位">No.${item.LastIndex}</span>`;
  // if (item.Type === 1)
  //   badge = `<span class="badge" title="${formatNumber(item.Rate, 1)}倍分红剩余${item.Bonus}期">×${item.Bonus}</span>`;

  var avatar = normalizeAvatar(item.Avatar);
  var box = `<li class="initial_item ${banned}"><a target="right" href="/user/${item.Name}" class="avatar"><img src="${avatar}">${badge}</a>
          <div class="info"><div class="name" title="${name}"><a target="_blank" href="/user/${item.Name}"><span>${index + 1}.</span>${item.Nickname}</a><span class="tag ${tclass}">${flu}</span></div><div class="money" title="每周股息 / 流动资金 / 初始资金">+₵${formatNumber(item.Share, 0)} / ₵${formatNumber(item.TotalBalance, 0)} / ${formatNumber(item.Principal, 0)}</div>
            <div class="current ${tclass}" title="总资产">₵${formatNumber(item.Assets, 0)}</div>
            <div class="time"><small>${formatTime(item.LastActiveDate)}</small></div></div></li>`;
  return box;
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
  var badge = renderBadge(item);

  var box = `<li class="initial_item chara"><a target="right" class="avatar" data-id="${item.Id}"><img src="${normalizeAvatar(item.Icon)}">${badge}</a>
            <div class="info"><div class="name" title="${item.Name}"><a target="_blank" href="/character/${item.Id}"><span>${index + 1}.</span>${item.Name}</a></div><div class="money" title="股息 / 总股份 / 总市值">+${formatNumber(item.Rate, 2)} / ${formatNumber(item.Total, 0)} / ₵${formatNumber(item.MarketValue, 0)}</div>
              <div class="current ${tclass}" title="现价 / 涨跌">₵${formatNumber(item.Current, 2)}<span class="tag ${tclass}">${flu}</span></div>
              <div class="time" title="买入 / 卖出 / 成交量"><small>${formatTime(item.LastOrder)}</small>${depth}</div></div></li>`;
  return box;
}

function renderBadge(item) {
  var badge = '';
  if (item.Level > 1) {
    if (item.Type == 1)
      badge = `<span class="badge" title="${formatNumber(item.Rate, 1)}倍分红剩余${item.Bonus}期">lv${item.Level}</span>`;
    else
      badge = `<span class="badge">lv${item.Level}</span>`;
  } else if (item.Type == 1) {
    badge = `<span class="badge new" title="${formatNumber(item.Rate, 1)}倍分红剩余${item.Bonus}期">×${item.Bonus}</span>`;
  }
  return badge;
}

function renderCharacter3(item, index) {
  var flu = '0.00';
  var tclass = 'even';
  if (item.Fluctuation > 0) {
    tclass = 'raise';
    flu = `+${formatNumber(item.Fluctuation * 100, 2)}%`;
  } else if (item.Fluctuation < 0) {
    tclass = 'fall';
    flu = `${formatNumber(item.Fluctuation * 100, 2)}%`;
  }

  var badge = renderBadge(item);
  var box = `<li class="initial_item chara"><a target="right" class="avatar" data-id="${item.Id}"><img src="${normalizeAvatar(item.Icon)}">${badge}</a>
              <div class="info"><div class="name" title="${item.Name}"><a target="_blank" href="/character/${item.Id}"><span>${index + 1}.</span>${item.Name}</a></div><div class="money" title="股息 / 底价 / 数量">+${formatNumber(item.Rate, 2)} / ₵${formatNumber(item.Price, 0)} / ${formatNumber(item.State, 0)}</div>
                <div class="current ${tclass}" title="现价 / 涨跌">₵${formatNumber(item.Current, 2)}<span class="tag ${tclass}">${flu}</span></div>
                <div class="time"><button class="auction_button" data-id="${item.Id}">[出价]</button><button class="history_button" data-id="${item.Id}">[上周]</button></div>
  </li>`;
  return box;
}

function loadIndexPage2() {
  if ($('#grailIndex').length === 0) {
    $('body').css('overflow-x', 'auto');
    var index = `<div id="grailIndex" class="grail_index">
                <div class="index"><div class="title">/ 最高市值</div><ul class="mvc"></ul></div>
                <div class="index"><div class="title">/ 最大涨幅</div><ul class="mrc"></ul></div>
                <div class="index"><div class="title">/ 最大跌幅</div><ul class="mfc"></ul></div>
              </div><div class="center_button"><button id="loadMoreButton2" class="load_more_button">[加载更多...]</button></div>`;
    $('#grailIndexTab').after(index);
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
  if ($('#grailIndex').length === 0) {
    $('body').css('overflow-x', 'auto');
    var box = `<div id="grailIndex" class="grail_index">
                <div class="index"><div class="title">/ ICO最多资金</div><ul class="volume"></ul></div>
                <div class="index"><div class="title">/ ICO最近活跃</div><ul class="popular"></ul></div>
                <div class="index"><div class="title">/ ICO即将结束</div><ul class="recent"></ul></div>
              </div><div class="center_button"><button id="loadMoreButton" class="load_more_button">[加载更多...]</button></div>`;
    $('#grailIndexTab').after(box);
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
          $('#grailIndex .volume').append(init);
        }
        loadMore |= (d.Value.length == size);
      }
      getData(`chara/rai/${page}/${size}`, function (d, s) {
        if (d.State === 0) {
          for (i = 0; i < d.Value.length; i++) {
            var item = d.Value[i];
            var init = renderInitial(item, i + start);
            $('#grailIndex .popular').append(init);
          }
          loadMore |= (d.Value.length == size);
        }
        getData(`chara/mri/${page}/${size}`, function (d, s) {
          if (d.State === 0) {
            for (i = 0; i < d.Value.length; i++) {
              var item = d.Value[i];
              var init = renderInitial(item, i + start);
              $('#grailIndex .recent').append(init);
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
  var tab = `<div id="grailIndexTab" class="grail_index_tab"><div id="tabButton1" class="tab_button active">交易榜单</div><div id="tabButton2" class="tab_button">ICO榜单</div></div>`;
  $('#grailBox2').after(tab);
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
  var tab = `<div id="grailIndexTab2" class="grail_index_tab"><div id="tabButton3" class="tab_button active">热门榜单</div><div id="tabButton4" class="tab_button">英灵殿</div></div>`;
  $('#grailBox2').after(tab);
  $('#tabButton3').on('click', function () {
    $('#tabButton3').addClass('active');
    $('#tabButton4').removeClass('active');
    $('#grailNewBangumi').show();
    $('#valhalla').hide();
    $('#pager1').show();
    $('#pager2').hide();
    loadNewBangumi(1);
  });
  $('#tabButton4').on('click', function () {
    $('#tabButton4').addClass('active');
    $('#tabButton3').removeClass('active');
    $('#grailNewBangumi').hide();
    $('#valhalla').show();
    $('#pager1').hide();
    $('#pager2').show();
    loadValhalla(1);
  });
}

function loadValhalla(page) {
  $('#valhalla .page').hide();

  var p = $(`#valhalla .page.page${page}`);
  if (p.length > 0) {
    $('#pager2 .p').removeClass('p_cur');
    $(`#pager2 .p[data-page=${page}]`).addClass('p_cur');
    p.show();
    return;
  }

  if ($('#valhalla').length == 0) {
    var valhalla = `<div id="valhalla" class="grail_index"><div class="loading" style="display:none"></div></div>`;
    $('#grailIndexTab2').after(valhalla);
  }

  $('#valhalla .loading').show();
  getData(`chara/user/chara/valhalla@tinygrail.com/${page}/36`, function (d, s) {
    $('#valhalla .loading').hide();
    $('#valhalla').append(`<div class="page page${page}"></div>`);
    if (d.State === 0) {
      var ids = [];
      var start = (page - 1) * 36;
      for (i = 0; i < d.Value.Items.length; i++) {
        var item = d.Value.Items[i];
        ids.push(parseInt(item.Id));
        var chara = $(renderCharacter3(item, i + start));
        $(`#valhalla .page.page${page}`).append(chara);
      }
      loadPager(d.Value.TotalPages, d.Value.CurrentPage, 'valhalla', 'pager2', loadValhalla, '#grailIndexTab2');
      $(`#valhalla .page.page${page} .auction_button`).on('click', (e) => {
        var cid = $(e.srcElement).data('id');
        var chara = d.Value.Items.find((c) => { return c.Id == cid; });
        openAuctionDialog(chara);
      });
      $(`#valhalla .page.page${page} .history_button`).on('click', (e) => {
        var cid = $(e.srcElement).data('id');
        var chara = d.Value.Items.find((c) => { return c.Id == cid; });
        openHistoryDialog(chara);
      });

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

function loadPager(total, current, target, pager, loadPage, anchor) {
  var p = $(`<div id="${pager}" class="grail page_inner"></div>`);

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
    $('#grailIndexTab2').after(`<div id="grailNewBangumi" class="grail_index"></div>`);
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
  loadPager(10, page, 'grailNewBangumi', 'pager1', loadNewBangumi, '#grailIndexTab2');
}

function loadGrailBox2(callback) {
  $('#grailBox2').remove();
  $('div.eden_rec_box').css('padding-left', 0);
  $('div.eden_rec_box').css('background', 'none');
  getUserAssets(function (d, s) {
    if (d.State === 0) {
      var bonus = `<button class="tag daily_bonus">已领取</button>`;
      var lastDate = new Date(d.Value.lastDate).setHours(0, 0, 0, 0);
      var today = new Date().setHours(0, 0, 0, 0);
      if (lastDate != today)
        bonus = `<button id="bonusButton" class="active tag daily_bonus">签到奖励</button>`;

      var userBox = `<div id="grailBox2" class="rakuen_home">
                    <div class="bold">「小圣杯」账户余额：₵${formatNumber(d.Value.Balance, 2)}
                      <button id="logoutButton" class="text_button">[退出登录]</button>
                      <button id="testButton" class="text_button">[股息预测]</button>
                      <button id="scratchButton" class="text_button">[刮刮乐]</button>
                    </div>${bonus}</div>`
      $('body').prepend(userBox);
      $('#logoutButton').on('click', function () { logout(loadGrailBox2) });
      $('#testButton').on('click', function () {
        getData('event/share/bonus/test', (d) => {
          if (d.State == 0) {
            alert(`本期计息股份共${formatNumber(d.Value.Total, 0)}股，预期股息₵${formatNumber(d.Value.Share, 2)}，需缴纳个人所得税₵${formatNumber(d.Value.Tax, 2)}`);
          } else {
            alert(d.Message);
          }
        });
      });
      $('#scratchButton').on('click', function () {
        if (confirm('消费₵1,000购买一张环保刮刮乐彩票？')) {
          getData('event/scratch/bonus', (d) => {
            if (d.State == 0) {
              alert(d.Value);
            } else {
              alert(d.Message);
            }
          });
        }
      });
      $('#bonusButton').on('click', function () { getDailyBangumiBonus(loadGrailBox2) });
    } else {
      var userBox = `<div id="grailBox2" class="rakuen_home"><div class="bold" style="margin: 7px 0 0 7px">点击授权登录，开启「小圣杯」最萌大战！</div><button id="loginButton" class="active tag">授权登录</button></div>`
      $('body').prepend(userBox);
      $('#loginButton').on('click', function () { login(loadGrailBox2) });
    }
    loadHolidayButton();
    loadPhoneButton();
    loadShareBonusButton();
    if (callback) callback();
  });
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

function loadRecommendButton(phone) {
  getData('account/recommend', function (d, s) {
    if (d.State === 0) {
      var button = `<button id="recommendButton" class="active tag phone_bonus">推荐奖励</button>`;
      $('button.daily_bonus').before(button);
      $('#recommendButton').on('click', function () { loadRecommendBox(d.Value, phone) });
    }
  });
}

function loadShareBonusButton() {
  getData('event/share/bonus/check', function (d, s) {
    if (d.State === 0) {
      var button = `<button id="shareBonusButton" class="active tag phone_bonus">每周分红</button>`;
      $('button.daily_bonus').before(button);
      $('#shareBonusButton').on('click', function () { getWeeklyShareBonus(loadGrailBox2) });
    }
  });
}

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
  var amount = 10000;
  var total = 0;
  var next = 100000;

  if (ico.Total < 100000 || ico.Users < 10) {
    return { Level: level, Next: next, Price: 0, Amount: 0 };
  }

  level = Math.floor(Math.sqrt(ico.Total / 100000));
  amount = 10000 + (level - 1) * 7500;
  price = ico.Total / amount;
  next = Math.pow(level + 1, 2) * 100000;

  return { Level: level, Next: next, Price: price, Amount: amount };
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
    var loadMore = `<li class="load_more"><button id="loadMoreButton" class="load_more_button" data-page="${page + 1}">[加载更多]</button></li>`;
    $('#eden_tpc_list ul').append(loadMore);
    $('#loadMoreButton').on('click', function () {
      var page = $(this).data('page');
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
  var change = `<span class="tag fall">${formatNumber(item.Change, 2)}</span>`;
  if (item.Change > 0)
    change = `<span class="tag raise">+${formatNumber(item.Change, 2)}</span>`;

  var id = '';
  if (item.Type === 4 || item.Type === 5 || item.Type === 6) {
    id = `data-id="${item.RelatedId}"`;
  }

  var log = `<li class="${line} item_list item_log" ${id}>
                    <div class="inner">${change} ₵${formatNumber(item.Balance, 2)}
                      <small class="grey">${formatTime(item.LogTime)}</small>
                      <span class="row"><small class="time">${item.Description}</small></span>
                    </div>
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

  var log = `<li class="${line} item_list item_log" ${id}>
                    <div class="inner"><span class="tag badge">×${formatNumber(item.Amount, 0)}</span>
                      ${item.Name}
                      <small class="grey">${formatTime(item.Last)}</small>
                      <span class="row"><small class="time">「${item.Line}」</small></span>
                    </div>
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

  var badge = renderBadge(item);
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
    mobile = `#split #listFrameWrapper {-webkit - overflow - scrolling:touch; overflow:auto; } #split #contentFrameWrapper {-webkit - overflow - scrolling:touch; overflow:auto; }`;

  $(parent.window.document.head).append('<meta name="viewport" content="maximum-scale=.75,minimum-scale=.75,user-scalable=0,width=device-width,initial-scale=.75,viewport-fit=cover" />');
  var css = `<style>
                    #split {display: flex; }
    #split #listFrameWrapper {width:450px; min-width:450px; float:inherit; flex-grow:1; z-index: 100; height: -webkit-fill-available; }
    #split #contentFrameWrapper {width:450px; float:inherit; flex-grow:5; height: -webkit-fill-available; }
    #split iframe {height: -webkit-fill-available; overflow-x:scroll; }
    #rakuenHeader div.navigator a {margin: 0 5px 0 0; }
    #rakuenHeader div.navigator a::after {content: "|"; margin-left: 5px; }
    #rakuenHeader div.navigator a:last-child::after {content: ""; }
    #rakuenHeader .navigator .menu {display:none; }
    ${mobile}
                    @media (max-width: 1200px) {
                    #rakuenHeader {background - position - x: 233px; }
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
  </style>`
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
  var dialog = `<div class="new_overlay" id="tradeDialog">
  <div class="new_dialog">
    <div id="grailBox"><div class="loading"></div></div>
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
      $('#grailBox').html(empty);
      $('#beginICOButton').on('click', function () { beginICO(id) });
    }
  });

  addCloseDialog('#tradeDialog');
}

function addCloseDialog(id) {
  if (!id.startsWith('#'))
    id = '#' + id;

  $(`${id} .close_button`).on('click', () => {
    $(id).remove();
    if ($('.new_overlay').length == 0)
      $('body').css('overflow-y', 'scroll');
  });
}

function loadLastTemples(page) {
  if (page == 1) {
    var last = `<div id="lastTemples">
  <div class="title">/ 最新圣殿</div>
  <div class="assets"></div></div>`;
    $('#grailBox2').after(last);
  }

  getData(`chara/temple/last/${page}/14`, d => {
    d.Value.Items.forEach(temple => {
      var cover = getSmallCover(temple.Cover);
      var avatar = normalizeAvatar(temple.Avatar);

      var name = temple.CharacterName;
      var rate = `+${formatNumber(temple.Rate, 2)}`;
      var full = formatNumber(temple.Sacrifices, 0);
      var level = '';
      if (temple.CharacterLevel > 1)
        level = `<span class="badge">lv${temple.CharacterLevel}</span>`;

      var card = `<div class="item">
        <div class="card" data-id="${temple.UserId}#${temple.CharacterId}" style="background-image:url(${cover})">
          <div class="tag"><span>${temple.Level}</span></div>
          <div class="buff">${rate}</div>
        </div>
        <div class="title" data-id="${temple.CharacterId}">
          ${level}<span data-id="${temple.CharacterId}" title="${name} ${formatNumber(temple.Assets, 0)} / ${full}">${name}</span>
        </div>
        <div class="name">
          <a target="_blank" title="${temple.Nickname}" href="/user/${temple.Name}">@${temple.Nickname}</a>
        </div>
      </div>`
      $('#lastTemples .assets').append(card);
      $(`#lastTemples .item .card[data-id="${temple.UserId}#${temple.CharacterId}"]`).data('temple', temple);
    });

    $('#loadMoreButton3').remove();
    if (d.Value.CurrentPage != d.Value.TotalPages) {
      var loadMore = `<div class="center_button"><button id="loadMoreButton3" data-page="${page + 1}" class="load_more_button">[加载更多...]</button></div>`
      $("#lastTemples").after(loadMore);
      $('#loadMoreButton3').on('click', e => {
        var mpage = $(e.currentTarget).data('page');
        loadLastTemples(mpage);
      });
    }
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
      $("#subject_info .board").after(box);
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

  $('body').on('click', '.initial_item a.avatar', e => {
    var id = $(e.currentTarget).data('id');
    if (id)
      openCharacterDialog(id);
  });

  $('body').on('click', '#lastTemples .item .card', e => {
    var temple = $(e.currentTarget).data('temple');
    if (temple)
      showTemple(temple);
  });

  $('body').on('click', '#lastTemples .item .title', e => {
    var cid = $(e.currentTarget).data('id');
    openCharacterDialog(cid);
  });

  loadGrailBox2(function () {
    loadIndexTab();
    loadIndexPage2();
    loadNewTab();
    loadNewBangumi(1);
    loadLastTemples(1);
  });
} else if (path.startsWith('/user/')) {
  var id = path.split('?')[0].substr(6);
  loadUserPage(id);
  // if (/^[0-9a-z_]{1,}$/.test(id)) {
  //   $.get(`//api.bgm.tv/user/${id}`, function (d, s) {
  //     loadUserPage(d.id);
  //   });
  // }
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