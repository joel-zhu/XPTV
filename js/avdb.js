const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko)'
const config = argsify($config_str)

let appConfig = {
    ver: 1,
    title: 'avdb',
    site: 'https://avdbapi.com/api.php/provide/vod',
}

async function getConfig() {
    let config = appConfig
    config.tabs = await getTabs()
    return jsonify(appConfig)
}

async function getTabs() {
    let tabs = []
    let url = appConfig.site

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    argsify(data).class.forEach((e) => {
        tabs.push({
            id: e.type_id,
            name: e.type_name,
            ext: {
                id: e.type_id,
            },
            ui: 1,
        })
    })

    return tabs
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let { id, page = 1 } = ext

    try {
        const url = appConfig.site + `?t=${id}&ac=detail&pg=${page}`

        const { data } = await $fetch.get(url, {
            headers: {
                'User-Agent': UA,
            },
        })

        argsify(data).list.forEach((e) => {
            cards.push({
                vod_id: `${e.id}`,
                vod_name: e.name,
                vod_pic: e.poster_url,
                vod_remarks: e.tag,
                vod_pubdate: e.created_at,
                vod_duration: e.time,
                ext: {
                    id: `${e.id}`,
                },
            })
        })

        return jsonify({
            list: cards,
        })
    } catch (error) {
        $print(error)
    }
}

// ==================== 修改开始 ====================
async function getTracks(ext) {
    ext = argsify(ext)
    let tracks = []
    let id = ext.id
    let url = appConfig.site + `?ac=detail&ids=${id}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    // 将数据解析一次，方便复用
    const parsedData = argsify(data);
    
    // 检查数据结构是否有效
    if (parsedData && parsedData.list && parsedData.list.length > 0) {
        const videoInfo = parsedData.list[0];

        // ***修改点***: 
        // 删除了 .split('?s=')[1]
        // 直接获取 link_embed 字段的完整值
        let vod_play_url = videoInfo.episodes.server_data.Full.link_embed

        tracks.push({
            name: videoInfo.episodes.server_name,
            pan: '',
            ext: {
                url: vod_play_url, // vod_play_url 现在是完整的 URL
            },
        })
    } else {
        // 如果 API 没有返回预期的 list 数据，可以打个日志
        $print(`[getTracks] Error: No video list found for id ${id}`);
    }

    return jsonify({
        list: [
            {
                title: '默认分组',
                tracks,
            },
        ],
    })
}
// ==================== 修改结束 ====================

async function getPlayinfo(ext) {
    ext = argsify(ext)
    let url = ext.url

    return jsonify({ urls: [url], headers: [{ 'User-Agent': UA, Referer: `https://avdbapi.com/` }] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []

    const text = encodeURIComponent(ext.text)
  S const page = ext.page || 1
    const url = `${appConfig.site}?ac=detail&wd=${text}&pg=${page}`

    const { data } = await $fetch.get(url, {
        headers: {
            'User-Agent': UA,
        },
    })

    argsify(data).list.forEach((e) => {
        cards.push({
            vod_id: `${e.id}`,
            vod_name: e.name,
            vod_pic: e.poster_url,
            vod_remarks: e.tag,
            vod_pubdate: e.created_at,
            vod_duration: e.time,
            ext: {
                id: `${e.id}`,
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
