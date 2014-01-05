// Porting tutorial code from http://www.ai-junkie.com/ann/evolved/nnt1.html
// Unfortunately I'm on a Mac and the code is developed for Windows machines.
// So just gonna do this in Javascript for simplicity.
(function(window, undefined) {
    var Vector2d = function(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    };

    Vector2d.prototype.add = function(rhs) {
        this.x += rhs.x;
        this.y += rhs.y;
        return this;
    };

    Vector2d.prototype.sub = function(rhs) {
        this.x -= rhs.x;
        this.y -= rhs.y;
        return this;
    };

    Vector2d.prototype.mul = function(rhs) {
        this.x *= rhs.x;
        this.y *= rhs.y;
        return this;
    };

    Vector2d.prototype.div = function(rhs) {
        this.x /= rhs.x;
        this.y /= rhs.y;
        return this;
    };

    var Vector2dAdd = function(lhs, rhs) {
        return new Vector2d(lhs.x + rhs.x, lhs.y + rhs.y);
    };

    var Vector2dSub = function(lhs, rhs) {
        return new Vector2d(lhs.x - rhs.x, lhs.y - rhs.y);
    };

    var Vector2dMul = function(lhs, rhs) {
        return new Vector2d(lhs.x * rhs.x, lhs.y * rhs.y);
    };

    var Vector2dDiv = function(lhs, rhs) {
        return new Vector2d(lhs.x / rhs.x, lhs.y / rhs.y);
    };

    // Use Pythagorean to find hypotenuse
    var Vector2dLength = function(vector2d) {
        return Math.sqrt(vector2d.x * vector2d.x + vector2d.y * vector2d.y);
    };

    // Calculate dot product
    var Vector2dDot = function(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    };

    // Find sign of vector. If positive, the v2 is clockwise of v1.
    // Anticlockwise if negative
    var Vector2dSign = function(v1, v2) {
        if (v1.y * v2.x > v1.x * v2.y) {
            return 1;
        } else {
            return -1;
        }
    };

    var Vector2dNormalize = function(v) {
        var vLength = Vector2dLength(v);
        v.x = v.x / vLength;
        v.y = v.y / vLength;
    };

    window.Vector2d = Vector2d;
    window.Vector2dAdd = Vector2dAdd;
    window.Vector2dSub = Vector2dSub;
    window.Vector2dMul = Vector2dMul;
    window.Vector2dDiv = Vector2dDiv;
    window.Vector2dLength = Vector2dLength;
    window.Vector2dDot = Vector2dDot;
    window.Vector2dSign = Vector2dSign;
    window.Vector2dNormalize = Vector2dNormalize;
}(window));