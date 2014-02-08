(function(window, undefined) {

    var copyImageContext = function(ctx) {
        var width = ctx.canvas.width;
        var height = ctx.canvas.height;

        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        var copyCtx = canvas.getContext('2d');
        copyCtx.putImageData(ctx.getImageData(0, 0, width, height), 0, 0);
        return copyCtx;
    };

    var thresholdImage = function(ctx) {
        imageToGrayScale(ctx);

        var maxAlpha = 255;

        var rgbaBytes = 4;
        var threshold = 100;
        var black = 0;
        var white = 255;

        var color;

        var width = ctx.canvas.width;
        var height = ctx.canvas.height;

        var masterData = ctx.getImageData(0, 0, width, height);
        var imageData = ctx.createImageData(width, height);

        var rgbaWidth = width * rgbaBytes;
        for (var row = 0; row < height; ++row) {
            var fauxRow = row * rgbaWidth;
            var fauxWidth = fauxRow + rgbaWidth;
            for (var col = fauxRow; col < fauxWidth; col += rgbaBytes) {
                color = black;
                if (masterData.data[col] > threshold) {
                    color = white;
                }
                imageData.data[col] = color;
                imageData.data[col + 1] = color;
                imageData.data[col + 2] = color;
                imageData.data[col + 2] = color;
                imageData.data[col + 3] = maxAlpha;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    };

    var imageToGrayScale = function(ctx) {
        var maxAlpha = 255;
        var rWeight = 0.21;
        var gWeight = 0.71;
        var bWeight = 0.07;
        var rgbaBytes = 4;

        var r, g, b, gray;

        var width = ctx.canvas.width;
        var height = ctx.canvas.height;

        var masterData = ctx.getImageData(0, 0, width, height);
        var imageData = ctx.createImageData(width, height);

        var rgbaWidth = width * rgbaBytes;
        for (var row = 0; row < height; ++row) {
            var fauxRow = row * rgbaWidth;
            var fauxWidth = fauxRow + rgbaWidth;
            for (var col = fauxRow; col < fauxWidth; col += rgbaBytes) {
                r = masterData.data[col];
                g = masterData.data[col + 1];
                b = masterData.data[col + 2];
                gray = rWeight * r + gWeight * g + bWeight * b;
                imageData.data[col] = gray;
                imageData.data[col + 1] = gray;
                imageData.data[col + 2] = gray;
                imageData.data[col + 3] = maxAlpha;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    };

    var sobel = function(ctx) {
        imageToGrayScale(ctx);
        gaussianBlur(ctx);

        ctxX = copyImageContext(ctx);
        sobelX(ctxX);

        ctxY = copyImageContext(ctx);
        sobelY(ctxY);

        var width = ctx.canvas.width;
        var height = ctx.canvas.height;

        var gradXData = ctxX.getImageData(0, 0, width, height);
        var gradYData = ctxY.getImageData(0, 0, width, height);

        var imageData = ctx.createImageData(width, height);

        var maxAlpha = 255;
        var rgbaBytes = 4;
        var rx, gx, bx, ry, gy, by;

        var rgbaWidth = width * rgbaBytes;
        for (var row = 0; row < height; ++row) {
            var fauxRow = row * rgbaWidth;
            var fauxWidth = fauxRow + rgbaWidth;
            for (var col = fauxRow; col < fauxWidth; col += rgbaBytes) {
                rx = gradXData.data[col];
                gx = gradXData.data[col + 1];
                bx = gradXData.data[col + 2];

                ry = gradYData.data[col];
                gy = gradYData.data[col + 1];
                by = gradYData.data[col + 2];

                imageData.data[col] = Math.sqrt(rx * rx + ry * ry);
                imageData.data[col + 1] = Math.sqrt(gx * gx + gy * gy);
                imageData.data[col + 2] = Math.sqrt(bx * bx + by * by);
                imageData.data[col + 3] = maxAlpha;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    };

    var sobelX = function(ctx) {
        var kernel = [
            1, 0, -1,
            2, 0, -2,
            1, 0, -1
        ];
        psf(ctx, kernel);
    };

    var sobelY = function(ctx) {
        var kernel = [
            1, 2, 1,
            0, 0, 0,
            -1, -2, -1
        ];
        psf(ctx, kernel);
    };

    var sharpen = function(ctx) {
        var k = 3.0;
        var n = -k/8.0;
        var c = k + 1.0;

        var kernel = [
            n, n, n,
            n, c, n,
            n, n, n
        ];
        psf(ctx, kernel);
    };

    var gaussianBlur = function(ctx) {
        var o16 = 1/16;
        var o8 = 1/8;
        var o4 = 1/4;

        var kernel = [
            o16, o8, o16,
            o8, o4, o8,
            o16, o8, o16,
        ];
        psf(ctx, kernel);
    };

    var psf = function(ctx, kernel) {
        var maxAlpha = 255;
        var rgbaBytes = 4;

        var width = ctx.canvas.width;
        var height = ctx.canvas.height;

        var masterData = ctx.getImageData(0, 0, width, height);
        var imageData = ctx.createImageData(width, height);

        var rgbaWidth = width * rgbaBytes;
        for (var row = 1; row < height - 1; ++row) {
            var fauxRow = row * rgbaWidth + rgbaBytes;
            var fauxWidth = fauxRow + rgbaWidth - 8;
            for (var col = fauxRow; col < fauxWidth; ++col) {
                if ((col + 1) % rgbaBytes == 0) {
                    imageData.data[col] = maxAlpha;
                } else {
                    var value = kernel[0] * masterData.data[(col - rgbaBytes) - rgbaWidth];
                    value += kernel[1] * masterData.data[col -  rgbaWidth];
                    value += kernel[2] * masterData.data[(col + rgbaBytes) - rgbaWidth];

                    value += kernel[3] * masterData.data[col - rgbaBytes];
                    value += kernel[4] * masterData.data[col];
                    value += kernel[5] * masterData.data[col + rgbaBytes];

                    value += kernel[6] * masterData.data[(col - rgbaBytes) + rgbaWidth];
                    value += kernel[7] * masterData.data[col +  rgbaWidth];
                    value += kernel[8] * masterData.data[(col + rgbaBytes) + rgbaWidth];

                    if (value < 0) {
                        value = 0;
                    }

                    if (value > maxAlpha) {
                        value = maxAlpha;
                    }

                    imageData.data[col] = value;
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
    };

    window.filters = {
        psf: psf,
        gaussianBlur: gaussianBlur,
        sharpen: sharpen,
        sobelY: sobelY,
        sobelX: sobelX,
        sobel: sobel,
        imageToGrayScale: imageToGrayScale,
        thresholdImage: thresholdImage,
        copyImageContext: copyImageContext
    };
}(window));