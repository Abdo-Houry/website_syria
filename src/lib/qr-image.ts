import QRCode from "qrcode";
import {
  BRAND_LOGO_HEIGHT,
  BRAND_LOGO_SRC,
  BRAND_LOGO_WIDTH,
} from "@/components/common/brand-logo";

/**
 * توليد صورة رمز QR تحمل شعار «صك» في مركزها.
 *
 * الشعار يحجب جزءاً من وحدات الرمز، لذلك نستخدم مستوى تصحيح الأخطاء الأعلى
 * (H ≈ 30%) ونُبقي مساحة الحجب دون ربع الرمز — وهو الحدّ الذي يبقى معه
 * الرمز مقروءاً من كل الماسحات.
 *
 * الشعار هو ملف العلامة نفسه بقناة شفافية، ونصبغه على الـ canvas بلون داكن
 * ليبقى التباين كافياً للطباعة بالأبيض والأسود.
 */

const DARK = "#0f2a24";
const LIGHT = "#ffffff";
/* أبيض بقناة شفافية صفر — تقبله مكتبة qrcode كلون «فاتح» شفاف. */
const TRANSPARENT = "#ffffff00";

/** عرض لوح الشعار نسبةً إلى ضلع الرمز — والارتفاع يتبع نسبة العلامة. */
const LOGO_WIDTH_RATIO = 0.3;

export interface QrRenderOptions {
  value: string;
  /** ضلع الرمز بالبكسل (بدون الهوامش). */
  size?: number;
  /** سطر نصّي يُطبع أسفل الرمز — يظهر في الصورة المنزَّلة فقط. */
  caption?: string;
  /**
   * بلا خلفية: الوحدات الداكنة والشعار فقط، وما عداهما شفاف —
   * للطباعة على تصميم الجواز دون مربّع أبيض.
   */
  transparent?: boolean;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

/** ينتظر جاهزية خطوط الصفحة حتى لا تُكتب التسمية بخط بديل. */
async function fontsReady() {
  try {
    await document.fonts?.ready;
  } catch {
    /* المتصفح لا يدعم Font Loading API — نكمل بالخط الافتراضي */
  }
}

/**
 * يحمّل ملف العلامة مرّة واحدة ويصبغه باللون الداكن.
 * الصورة الأصلية بيضاء بقناة شفافية، و`source-in` يستبدل لونها مع الحفاظ
 * على حوافّها الناعمة.
 */
let tintedLogo: Promise<HTMLCanvasElement> | null = null;

function loadLogo(): Promise<HTMLCanvasElement> {
  tintedLogo ??= new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = BRAND_LOGO_WIDTH;
      canvas.height = BRAND_LOGO_HEIGHT;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("canvas unavailable"));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "source-in";
      context.fillStyle = DARK;
      context.fillRect(0, 0, canvas.width, canvas.height);

      resolve(canvas);
    };
    image.onerror = () => {
      tintedLogo = null;
      reject(new Error("logo unavailable"));
    };
    image.src = BRAND_LOGO_SRC;
  });

  return tintedLogo;
}

/** يرسم لوح الشعار في مركز الرمز. */
function drawLogo(
  context: CanvasRenderingContext2D,
  logo: HTMLCanvasElement,
  centerX: number,
  centerY: number,
  width: number,
  transparent = false,
) {
  const logoHeight = width / (BRAND_LOGO_WIDTH / BRAND_LOGO_HEIGHT);

  /* هامش حول الكلمة حتى لا تلتصق بوحدات الرمز. */
  const padX = width * 0.16;
  const padY = logoHeight * 0.55;
  const boxWidth = width + padX * 2;
  const boxHeight = logoHeight + padY * 2;

  context.save();

  /*
    لوح الشعار بإطار داكن — يفصل الشعار عن وحدات الرمز بوضوح.
    في الوضع الشفاف نُفرغ اللوح (نمسح الوحدات تحته) بدل تلوينه بالأبيض.
  */
  roundedRect(
    context,
    centerX - boxWidth / 2,
    centerY - boxHeight / 2,
    boxWidth,
    boxHeight,
    boxHeight * 0.28,
  );
  if (transparent) {
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "#000";
    context.fill();
    context.globalCompositeOperation = "source-over";
  } else {
    context.fillStyle = LIGHT;
    context.fill();
  }
  context.lineWidth = Math.max(2, boxHeight * 0.07);
  context.strokeStyle = DARK;
  context.stroke();

  context.drawImage(
    logo,
    centerX - width / 2,
    centerY - logoHeight / 2,
    width,
    logoHeight,
  );

  context.restore();
}

/**
 * يبني صورة الرمز كاملة ويعيد الـ canvas.
 * منفصلة عن `toDataURL` حتى يمكن إعادة استعمالها للتنزيل والعرض معاً.
 */
async function renderCanvas({
  value,
  size = 256,
  caption,
  transparent = false,
}: QrRenderOptions): Promise<HTMLCanvasElement> {
  const padding = Math.round(size * 0.06);
  const captionHeight = caption ? Math.round(size * 0.14) : 0;

  const qrCanvas = document.createElement("canvas");

  await QRCode.toCanvas(qrCanvas, value, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: DARK, light: transparent ? TRANSPARENT : LIGHT },
  });

  const canvas = document.createElement("canvas");
  canvas.width = size + padding * 2;
  canvas.height = size + padding * 2 + captionHeight;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");

  if (!transparent) {
    context.fillStyle = LIGHT;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(qrCanvas, padding, padding, size, size);

  drawLogo(
    context,
    await loadLogo(),
    padding + size / 2,
    padding + size / 2,
    Math.round(size * LOGO_WIDTH_RATIO),
    transparent,
  );

  if (caption) {
    /* الخط قد لا يكون جاهزاً عند أول رسم — ننتظره حتى لا تُكتب بخط بديل. */
    await fontsReady();

    context.fillStyle = DARK;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `600 ${Math.round(size * 0.055)}px Cairo, sans-serif`;
    /* منتصف الشريط المخصّص للتسمية أسفل الرمز. */
    context.fillText(
      caption,
      canvas.width / 2,
      size + padding * 2 + captionHeight / 2,
    );
  }

  return canvas;
}

/** صورة الرمز كـ data URL — للعرض داخل الواجهة. */
export async function renderQrDataUrl(options: QrRenderOptions): Promise<string> {
  const canvas = await renderCanvas(options);
  return canvas.toDataURL("image/png");
}

/** ينزّل صورة PNG للرمز على جهاز المشرف. */
export async function downloadQrPng(
  options: QrRenderOptions & { fileName: string },
): Promise<void> {
  const canvas = await renderCanvas({
    ...options,
    /* مقاس طباعة مريح بدل مقاس العرض على الشاشة. */
    size: options.size ?? 1024,
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );

  if (!blob) throw new Error("export failed");

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = options.fileName.endsWith(".png")
    ? options.fileName
    : `${options.fileName}.png`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  /* الإفلات الفوري يقطع التنزيل في بعض المتصفحات. */
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
