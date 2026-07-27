use std::io::{self, Write};
use tracing_subscriber::fmt;

pub fn init() {
    let _ = fmt()
        .with_target(false)
        .with_ansi(false)
        .with_writer(|| CollectorWriter(io::stdout()))
        .compact()
        .try_init();
}

struct CollectorWriter<W: Write>(W);

impl<W: Write> Write for CollectorWriter<W> {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.0.write_all(b"[BmtCaptureCollector] ")?;
        self.0.write(buf)
    }

    fn flush(&mut self) -> io::Result<()> {
        self.0.flush()
    }
}
