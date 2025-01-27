# Succinct Trie Data Structure

## Intro
Ein grosser Nachteil von Hyphenopoly ist, dass die Trennmuster jeweils vom Browser geladen werden müssen. Je nach Sprache ist dies eine nicht zu vernachlässigende Grösse. Deshalb ist hier eine entsprechend sparsame und dennoch performante Datenstruktur von zentraler Bedeutung.

## Vorläufer
Am Beispiel der Trennmuster für US-Englisch wird aufgezeigt, welche Fortschritte Hyphenopoly (und sein Vorgänger Hyphenator) in diesem Bereich gemacht haben.

### TeX Muster
Die originalen Muster aus der TeX-Welt sind eine einfache .tex-Datei. Jedes Muster steht auf einer neuen Zeile:
````text
1ba
1be
1abd
1abf
1bba
````
Diese Muster (ohne Lizenztext und Ausnahmen) belegen 31’551 Byte.

### Hyphenator
In Hyphenator sind die Trennmuster in einem JSON-Objekt gespeichert. Um die Dateigrösse zu reduzieren sind gleichlange Muster zu einem langen String verkettet und müssen beim Einlesen entsprechend aufgesplittet werden:
````javascript
{
    patterns: {
        3: "1ba1be",
        4: "1abd1abf1bba"
    }
}
````
Diese Muster (ohne Lizenztext und Ausnahmen) belegen 26’720 Byte.

### hpb (Hyphenopoly pattern binary)
In Hyphenopoly < v5 werden die Muster in einer Binären Datei gespeichert. Alle Buchstaben werden dabei auf eine Zahl von 13 bis 255 abgebildet; die Trennwerte (0-12) werden direkt gespeichert. Damit können auch Alphabete mit Buchstaben, die mehr als ein Byte belegen, sparsam gespeichert werden. Wie bei Hyphenator werden die Trennmuster gleicher länge zusammengefasst. Ausserdem wird jeweils ein Präfix aus zwei Zeichen vorangestellt:

Die Muster
````text
'1ba 1be 1abd 1abf 1bba'
````
werden wie folgt abgespeichert:
````text
'0 3 255 1 b a e 0 4 255 1 a b d b f 255 1 b b a'
````
`0`markiert den Anfang einer Gruppe von Mustern gleicher Länge.
`255` markiert den Anfang einer Präfixgruppe.

Diese Muster (mit Lizenztext und Ausnahmen) belegen noch 22’676 Byte.

### Arbeitsspeicherbedarf
Alle diese Ansätze zur Speicherplatzreduzierung gelten nur für die Übertragung zum Browser. Bei der Ausführung müssen diese Muster dann in einen Trie expandiert werden, der seinerseit wiederum ein Mehrfaches an Arbeitsspeicher benötigt.

## Succinct Trie
In einem "Succinct Trie" werden die Daten so abgespeichert, dass

* der Speicherbedarf nahe am informationstheoretischen Minimum liegt
* und der Algorithmus direkt auf den gespeicherten Daten läuft; eine Expansion in den Arbeitsspeicher entfällt also.

### Wie funktioniert das?

Zuerst werden die Daten in einem Baum mit einem zusätzlichen root-Knoten (das macht es später einfacher) dargestellt. Dabei werden die Trennwerte vorerst nicht berücksichtigt. Wir schreiben sie einfach mal neben dem entsprechenden Endknoten hin (blaue Werte). Dann wird für jeden Knoten die Anzahl seiner Kindknoten bestimmt und eine entsprechende Anzahl Bits gesetzt (1), gefolgt von einem ungesetzten Bit (0). Das sind die roten Werte.
<svg width="500" height="500" version="1.1" xmlns="http://www.w3.org/2000/svg">
 <circle cx="250" cy="70" r="20" fill="none" stroke="#f00"/>
 <circle cx="250" cy="150" r="20" fill="none" stroke="#000"/>
 <text x="236" y="155" font-family="sans-serif" font-size="16px">root</text>
 <circle cx="120" cy="230" r="20" fill="none" stroke="#000"/>
 <text x="115" y="235" font-family="sans-serif" font-size="16px">a</text>
 <circle cx="120" cy="310" r="20" fill="none" stroke="#000"/>
 <text x="115" y="315" font-family="sans-serif" font-size="16px">b</text>
 <circle cx="80" cy="390" r="20" fill="none" stroke="#000"/>
 <text x="75" y="395" font-family="sans-serif" font-size="16px">d</text>
 <circle cx="160" cy="390" r="20" fill="none" stroke="#000"/>
 <text x="157" y="395" font-family="sans-serif" font-size="16px">f</text>
 <circle cx="380" cy="230" r="20" fill="none" stroke="#000"/>
 <text x="375" y="235" font-family="sans-serif" font-size="16px">b</text>
 <circle cx="300" cy="310" r="20" fill="none" stroke="#000"/>
 <text x="295" y="315" font-family="sans-serif" font-size="16px">a</text>
 <circle cx="380" cy="310" r="20" fill="none" stroke="#000"/>
 <text x="375" y="315" font-family="sans-serif" font-size="16px">b</text>
 <circle cx="460" cy="310" r="20" fill="none" stroke="#000"/>
 <text x="455" y="315" font-family="sans-serif" font-size="16px">e</text>
 <circle cx="380" cy="390" r="20" fill="none" stroke="#000"/>
 <text x="375" y="395" font-family="sans-serif" font-size="16px">a</text>
 <g fill="none" stroke="#000" stroke-width="1px">
  <path d="m250 90v40"/>
  <path d="m232.97 160.48-95.934 59.036"/>
  <path d="m120 250v40"/>
  <path d="m111.06 327.89-22.112 44.223"/>
  <path d="m128.94 327.89 22.112 44.223"/>
  <path d="m267.03 160.48 95.934 59.036"/>
  <path d="m365.86 244.14-51.716 51.716"/>
  <path d="m380 250v40"/>
  <path d="m394.14 244.14 51.716 51.716"/>
  <path d="m380 330v40"/>
 </g>
 <g font-family="sans-serif" font-size="16px" fill="#ff0000">
   <text x="275" y="80">10</text>
   <text x="275" y="160">110</text>
   <text x="145" y="240">10</text>
   <text x="405" y="240">1110</text>
   <text x="145" y="320">110</text>
   <text x="325" y="320">0</text>
   <text x="405" y="320">10</text>
   <text x="485" y="320">0</text>
   <text x="105" y="400">0</text>
   <text x="185" y="400">0</text>
   <text x="405" y="400">0</text>
</g>

<g font-family="sans-serif" font-size="12px" fill="#0000ff">
    <text x="285" y="350">100</text>
    <text x="445" y="350">100</text>
    <text x="65" y="430">1000</text>
    <text x="145" y="430">1000</text>
    <text x="365" y="430">1000</text>
</g>
</svg>

Nun werden in einem Breitensuche-Verfahren sowohl die roten Werte, als auch die
Buchstaben in den Knoten der Reihe nach rausgeschrieben. Ein weiteres Bitmuster
gibt Auskunft, ob zum jeweiligen Knoten noch Trennwerte vorhanden sind.

````text
sTrie bitmap: 101101011101100100000
sTrie chars:  _abbabedfa
sTrie hasVal: 0000101111
````

Für die Trennwerte ist eine zusätzliche Datenstruktur nötig, da diese nicht im
"Succinct Trie" abgelegt werden können. Die Trennwerte (die Ziffern zwischen den
Buchstaben in den TeX-Mustern) werden zuerst extrahiert; d.h. wenn keine Ziffer
da steht, wird eine `0` geschrieben.

````text
.da6ch7en -> 00060700
3e4rosio  -> 3400000
````

Da nun viele Trennwerte mit einer Reihe von Nullen beginnt werden diese zu einem
Wert zusammengefasst. Ausserdem können die Nullen am Ende weggelassen werden.

````text
.da6ch7en -> 00060700 -> 3607
3e4rosio  -> 3400000  -> 034
````

Die erste Ziffer gibt also immer die Anzahl der führenden Nullen, bzw. den Offset
ins Muster an. Darauf folgen die eigentlichen Trennwerte.

Da die Ziffern der Trennwerte immer kleiner als 16 sind, können jeweils zwei Werte
in einem Byte gespeichert werden.

````text
.da6ch7en -> 00060700 -> 3 6 0 7 -> 0011 0110 0000 0111 -> 54 7
````

Die Trennwerte werden nun wie folgt abgespeichert:

1. In einem Bitmuster wird die Länge der Muster abgelegt: es werden so viele Bits
gesetzt, wie das Muster lang ist. Dazwischen wird eine Null gesetzt.
2. Weiter werden die komprimierten Trennwerte der Reihe nach abgespeichert.

Diese Muster (ohne Lizenztext aber mit Ausnahmen) belegen noch 19'672 Byte.

### Wie werden die Muster und die Trennwerte ausgelesen?
Für das Auslesen des "Succinct Trie" sind zwei Funktionen zentral:

`rank1` gibt die Anzahl gesetzter Bits (`1`) bis zu einer bestimmten Position aus.

`select0` gibt die kleinste Position aus, bis zu der eine bestimmte Anzahl Bits
_nicht_ gesetzt (`0`) sind. Da zum vorliegenden Zweck auch die Anzahl gesetzter
Bits, die auf die gefundene Position folgen, benötigt werden, werden diese gleich
mit ausgegeben.

````text
rank1(101101011101100100000, 3) -> 3
select0(101101011101100100000, 3) -> 6, 3
````

Um nun z.B. das Muster `ba` zu finden, folgen wir folgendem Algorithmus:

1. Nimm den ersten Buchstaben -> b
2. Finde die erste Null -> 1
3. Zähle die darauf folgenden 1en -> 2 (d.h. 2 Kindknoten)
4. Überprüfe für jeden Kindknoten, ob der entsprechende Wert in chars mit dem
Buchstaben aus 1 übereinstimmt. Brich ab, wenn kein Buchstabe gefunden wird.
Dann ist das Muster nicht im Trie.
5. Wenn der Wert in hasVal 1 ist -> lies die Trennwerte aus (s.u.)
6. Die Nummer des Kindknoten (hier 2) addiert zur Position aus 2 gibt uns an, welche Null wir als nächstes finden müssen -> 3
7. Nimm den nächsten Buchstaben -> a
8. Zähle die Einsen nach der 3. Null (von Schritt 6) -> 3
9. weiter mit Schritt 4.

Um die Trennwerte (Schritt 5) auszulesen, wird zuerst der `rank1` an der jeweiligen Position ausgelesen.
Das gibt den Index des Trennmusters zurück. Nun Wird ein `select0` mit diesem Index auf dem Bitmuster der Trennwerte berechnet.
Das gibt zusätzlich zur Position die Länge der Trennwerte aus. Mit der Position und der Länge können nun die Trennwerte ausgelesen werden.

Es werden alle Trennwerte gespeichert, auch die Doubletten. Das scheint auf den ersten Blick verschwenderisch zu sein, wenn
aber Doubletten vermieden werden sollten, müsste für jeden Trennwert eine 16Bit-Adresse (12 Bit für die Adresse und 4 Bit für die Länge. Auch nach der Dedublizierung weisen die meisten Sprachen mehr als 256 unterschiedliche Trennwerte auf.) gespeichert werden, was bei den meisten Mustern mehr Platz benötigt, da viele Trennwerte in einem Byte gespeichert werden können.

## Zusammenfassung
Grosse Trennmuster lassen sich in einem "Succinct Trie" platzsparender abspeichern (kleine Musterdateien brauchen etwas mehr Platz, da sie weniger Redundanzen aufweisen und der Overhead durch die Bitmuster dann mehr ins Gewicht fällt). Nach der zusätzlichen Kompression (z.B. mittels deflate) sind die Mustergrössen vergleichbar.

Das Auslesen des "Succinct Trie" benötigt ein paar Code-Zeilen mehr, was die .wasm-Datei zusätzlich etwas grösser macht.

Der grosse Vorteil des "Succinct Trie" ist, dass direkt auf der Datenstruktur gelesen werden kann und keine teure Expansion in einen Trie im Arbeitsspeicher mehr nötig ist. Der Arbeitsspeicherbedarf reduziert sich damit auf etwa 10%!
