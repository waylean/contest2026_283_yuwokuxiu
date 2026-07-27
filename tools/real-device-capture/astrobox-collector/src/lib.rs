use astrobox_ng_wit::FutureReader;
use astrobox_ng_wit::exports::astrobox::psys_plugin::{
    event_v3::{self, EventType},
    lifecycle,
};

mod logger;
mod ui;

struct BmtCaptureCollector;

impl event_v3::Guest for BmtCaptureCollector {
    fn on_event(event_type: EventType, event_payload: String) -> FutureReader<String> {
        let (writer, reader) = astrobox_ng_wit::wit_future::new::<String>(String::new);
        if event_type == EventType::InterconnectMessage {
            ui::record_interconnect_message(&event_payload);
        }
        astrobox_ng_wit::spawn(async move {
            let _ = writer.write(String::new()).await;
        });
        reader
    }

    fn on_ui_event_v3(
        event_id: String,
        event: event_v3::Event,
        _event_payload: String,
    ) -> FutureReader<String> {
        let (writer, reader) = astrobox_ng_wit::wit_future::new::<String>(String::new);
        astrobox_ng_wit::block_on(async {
            ui::handle_ui_event(event, &event_id).await;
        });
        astrobox_ng_wit::spawn(async move {
            let _ = writer.write(String::new()).await;
        });
        reader
    }

    fn on_ui_render(element_id: String) -> FutureReader<()> {
        let (writer, reader) = astrobox_ng_wit::wit_future::new::<()>(|| ());
        ui::render(&element_id);
        astrobox_ng_wit::spawn(async move {
            let _ = writer.write(()).await;
        });
        reader
    }

    fn on_card_render(_card_id: String) -> FutureReader<()> {
        let (writer, reader) = astrobox_ng_wit::wit_future::new::<()>(|| ());
        astrobox_ng_wit::spawn(async move {
            let _ = writer.write(()).await;
        });
        reader
    }
}

impl lifecycle::Guest for BmtCaptureCollector {
    fn on_load() {
        logger::init();
        tracing::info!("collector loaded");
    }
}

astrobox_ng_wit::export!(BmtCaptureCollector);
