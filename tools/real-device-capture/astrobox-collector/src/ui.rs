use astrobox_ng_wit::astrobox::psys_host::{
    device,
    register,
    ui_v3 as ui,
};
use std::sync::{Mutex, OnceLock};

const PACKAGE: &str = "com.waylean.bmtsmash.capture";
const EVENT_REFRESH: &str = "refresh";
const EVENT_REGISTER: &str = "register";

struct State {
    root: Option<String>,
    address: Option<String>,
    device_name: String,
    registered: bool,
    frame_count: usize,
    last_message: String,
}

static STATE: OnceLock<Mutex<State>> = OnceLock::new();

fn state() -> &'static Mutex<State> {
    STATE.get_or_init(|| Mutex::new(State {
        root: None,
        address: None,
        device_name: "未选择".into(),
        registered: false,
        frame_count: 0,
        last_message: "先连接手环，再依次点击刷新和注册".into(),
    }))
}

fn lock() -> std::sync::MutexGuard<'static, State> {
    state().lock().unwrap_or_else(|value| value.into_inner())
}

pub fn render(element_id: &str) {
    lock().root = Some(element_id.to_string());
    astrobox_ng_wit::astrobox::psys_host::ui_v3::render(element_id, view());
}

fn view() -> ui::Element {
    let status = {
        let value = lock();
        format!(
            "设备: {}\n监听: {}\n已接收分片: {}\n{}",
            value.device_name,
            if value.registered { "已注册" } else { "未注册" },
            value.frame_count,
            value.last_message
        )
    };
    ui::Element::new(ui::ElementType::Div, None)
        .flex()
        .flex_direction(ui::FlexDirection::Column)
        .width_full()
        .child(ui::Element::new(
            ui::ElementType::P,
            Some("BMT Capture Collector"),
        ).size(24))
        .child(ui::Element::new(ui::ElementType::P, Some(status.as_str())).size(15))
        .child(button("1 刷新并选择已连接手环", EVENT_REFRESH))
        .child(button("2 注册诊断包监听", EVENT_REGISTER))
        .child(ui::Element::new(
            ui::ElementType::P,
            Some("保持本窗口开启，然后在手环点击生成导出索引。"),
        ).size(14))
}

fn button(label: &str, event_id: &str) -> ui::Element {
    ui::Element::new(ui::ElementType::Button, Some(label))
        .bg("#111111")
        .text_color("#FFFFFF")
        .on(ui::Event::Click, event_id)
}

pub async fn handle_ui_event(event: ui::Event, event_id: &str) {
    if event != ui::Event::Click {
        return;
    }
    match event_id {
        EVENT_REFRESH => refresh().await,
        EVENT_REGISTER => register_receiver().await,
        _ => {}
    }
    rerender();
}

async fn refresh() {
    let connected = device::get_connected_device_list().await;
    let mut value = lock();
    if let Some(first) = connected.first() {
        value.address = Some(first.addr.clone());
        value.device_name = first.name.clone();
        value.registered = false;
        value.last_message = "已选择设备".into();
    } else {
        value.address = None;
        value.device_name = "未发现设备".into();
        value.registered = false;
        value.last_message = "请先在 AstroBox 首页连接手环".into();
    }
}

async fn register_receiver() {
    let address = lock().address.clone();
    let Some(address) = address else {
        lock().last_message = "请先刷新设备".into();
        return;
    };
    let result = register::register_interconnect_recv(&address, PACKAGE).await;
    let mut value = lock();
    value.registered = result.is_ok();
    value.last_message = if result.is_ok() {
        "监听成功，等待手环导出".into()
    } else {
        format!("监听失败: {:?}", result)
    };
}

pub fn record_interconnect_message(payload: &str) {
    tracing::info!("BMT_CAPTURE_FRAME {}", payload);
    {
        let mut value = lock();
        value.frame_count = value.frame_count.saturating_add(1);
        value.last_message = format!("收到第 {} 片", value.frame_count);
    }
    rerender();
}

fn rerender() {
    let root = lock().root.clone();
    if let Some(root) = root {
        astrobox_ng_wit::astrobox::psys_host::ui_v3::render(&root, view());
    }
}
